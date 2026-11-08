"use server";

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { event } from "@/config/event";
import { routing } from "@/i18n/routing";

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
        body,
      }),
      cache: "no-store",
    });
    const result = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    if (!res.ok || !result?.ok) throw new Error(`Apps Script replied ${res.status}`);
  } catch (err) {
    console.error("RSVP save failed", err);
    return { status: "error", message: t("errors.server") };
  }

  return { status: "done", name: firstName, attending };
}
