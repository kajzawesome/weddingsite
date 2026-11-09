"use server";

import { hasLocale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { event } from "@/config/event";
import { routing } from "@/i18n/routing";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { googleCalendarUrl } from "@/lib/calendar";
import { localize } from "@/lib/localized";
import { renderEmail } from "@/lib/emailTemplate";

// Small copies of our art and photo, made for email (in public/email).
const EMAIL_IMAGES = { garland: "garland.png", couple: "couple.jpg", roses: "roses.png" };

// The images as base64 text, so the Apps Script can attach them to the email.
async function emailImages() {
  try {
    const entries = await Promise.all(
      Object.entries(EMAIL_IMAGES).map(async ([name, file]) => {
        const data = await readFile(path.join(process.cwd(), "public", "email", file));
        return [name, { data: data.toString("base64"), type: file.endsWith(".png") ? "image/png" : "image/jpeg" }];
      }),
    );
    return Object.fromEntries(entries) as Record<string, { data: string; type: string }>;
  } catch {
    return undefined; // no pictures is better than no email
  }
}

// What the form sends back to the page after submitting.
export type RsvpState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: Partial<Record<"name" | "email" | "guests", string>> }
  | { status: "done"; name: string; attending: boolean };

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  attending: z.enum(["yes", "no"]),
  guests: z.coerce.number().int().min(1).max(8),
  message: z.string().trim().max(1000).optional(),
});

/*
  Server Action: this function runs on our server (never in the guest's browser),
  so the secret Google Script URL stays private. The form calls it directly.

  Flow: validate the answers → send them to our Google Apps Script, which adds a
  row to the RSVP sheet and emails the guest a confirmation from our Gmail.
*/
export async function submitRsvp(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const rawLocale = String(formData.get("locale") ?? "");
  const locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Rsvp" });

  // Honeypot: a hidden field real people never fill in. Bots usually do.
  if (formData.get("website")) return { status: "done", name: "", attending: true };

  const attending = formData.get("attending") === "yes";
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    attending: formData.get("attending"),
    guests: attending ? formData.get("guests") : 1,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    const issues = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.check"),
      fields: {
        name: issues.name ? t("errors.name") : undefined,
        email: issues.email ? t("errors.email") : undefined,
        guests: issues.guests ? t("errors.guests") : undefined,
      },
    };
  }

  const url = process.env.RSVP_SCRIPT_URL;
  const secret = process.env.RSVP_SECRET;
  if (!url || !secret) {
    console.error("RSVP_SCRIPT_URL / RSVP_SECRET missing in .env.local");
    return { status: "error", message: t("errors.server") };
  }

  const { name, email, guests, message } = parsed.data;
  const firstName = name.split(" ")[0];
  const count = attending ? guests : 0;

  // The confirmation email, written in the guest's language.
  const subject = t("email.subject", event.couple);
  const body = [
    t("email.greeting", { name: firstName }),
    "",
    attending ? t("email.yes", { count }) : t("email.no"),
    "",
    t("email.change"),
    "",
    t("email.signoff", event.couple),
  ].join("\n");

  // The same email, designed (see lib/emailTemplate.ts). The plain text above
  // stays as the fallback for email apps that don't show HTML.
  const hero = await getTranslations({ locale, namespace: "Hero" });
  const day = await getTranslations({ locale, namespace: "Schedule" });
  const format = await getFormatter({ locale });
  const site = process.env.SITE_URL?.replace(/\/$/, "");
  const online = site?.startsWith("https://");

  // Email apps can't load pictures from localhost. Once the site is online the
  // email links to them; before that, they travel inside the email as
  // attachments, which the HTML points to with "cid:name".
  const images = online ? undefined : await emailImages();
  const img = (name: keyof typeof EMAIL_IMAGES) =>
    online ? `${site}/email/${EMAIL_IMAGES[name]}` : images ? `cid:${name}` : undefined;
  const photo = img("couple");

  const parts = [
    { label: day("sealing"), note: day("sealingNote"), venue: event.sealing },
    { label: day("ringCeremony"), note: day("ringNote"), venue: event.ringCeremony },
    { label: day("reception"), note: day("receptionNote"), venue: event.reception },
  ];
  const where = event.reception.address ?? event.ringCeremony.address ?? event.sealing.address;
  const start = event.startsAt ?? event.date;
  const calendar = start
    ? googleCalendarUrl({
        title: t("email.calendarTitle", event.couple),
        start,
        end: event.endsAt,
        location: where,
        details: online ? `${site}/${locale}` : undefined,
      })
    : null;
  const dressCode = event.dressCode ? localize(event.dressCode, locale) : null;

  const html = renderEmail({
    lang: locale,
    preview: attending ? t("email.yes", { count }) : t("email.no"),
    kicker: hero("kicker"),
    ...event.couple,
    dateLine: event.date
      ? format.dateTime(new Date(event.date), { dateStyle: "long", timeZone: "UTC" })
      : hero("dateSoon"),
    greeting: t("email.greeting", { name: firstName }),
    paragraphs: [attending ? t("email.yes", { count }) : t("email.no")],
    summaryTitle: t("email.summary"),
    summary: [
      [t("email.name"), name],
      [t("email.attending"), attending ? t("fields.yes") : t("fields.no")],
      ...(attending ? [[t("email.guests"), String(count)] as [string, string]] : []),
      ...(message ? [[t("email.note"), message] as [string, string]] : []),
    ],
    schedule: attending
      ? {
          title: day("title"),
          items: parts.map(({ label, note, venue }) => ({
            label,
            note,
            time: venue.time ?? day("timeSoon"),
            place: venue.name ?? day("venueSoon"),
            address: venue.address ?? undefined,
            map: venue.mapUrl ? { label: day("map"), href: venue.mapUrl } : undefined,
          })),
          extra: dressCode ? [t("email.dressCode"), dressCode] : undefined,
        }
      : undefined,
    buttons: [
      ...(attending && calendar ? [{ label: t("email.calendar"), href: calendar }] : []),
      ...(online ? [{ label: t("email.visit"), href: `${site}/${locale}`, outline: !!(attending && calendar) }] : []),
    ],
    footnote: t("email.change"),
    signoff: t("email.signoff", event.couple),
    art: img("garland"),
    photo: photo ? { src: photo, alt: hero("photoAlt", event.couple) } : undefined,
    footerArt: img("roses"),
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      // Apps Script reads the raw body; text/plain avoids an extra CORS-style preflight.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret,
        name,
        email,
        attending: attending ? "Yes" : "No",
        guests: count,
        message: message ?? "",
        locale,
        subject,
        html,
        images,
        body,
      }),
      cache: "no-store",
    });
    const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    // "unauthorized" = RSVP_SECRET doesn't match SECRET in the script
    if (!res.ok || !result?.ok) throw new Error(`Apps Script replied ${res.status}: ${result?.error ?? "not JSON"}`);
  } catch (err) {
    console.error("RSVP save failed", err);
    return { status: "error", message: t("errors.server") };
  }

  return { status: "done", name: firstName, attending };
}
