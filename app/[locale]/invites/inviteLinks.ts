import "server-only";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { routing, type Locale } from "@/i18n/routing";
import { emailImages } from "@/lib/emailImages";
import { renderEmail } from "@/lib/emailTemplate";
import type { Guest } from "@/lib/sheet";

export function guestLocale(guest: Pick<Guest, "lang">): Locale {
  return hasLocale(routing.locales, guest.lang) ? guest.lang : routing.defaultLocale;
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

// e.g. https://www.casamentojacobs.com/pt/i/ana-silva
export function inviteLink(guest: Pick<Guest, "slug" | "lang">) {
  return `${siteUrl()}/${guestLocale(guest)}/i/${guest.slug}`;
}

// wa.me opens WhatsApp with the message typed in. With no number, WhatsApp
// asks which chat to send it to.
export async function whatsappLink(guest: Pick<Guest, "slug" | "lang" | "name" | "phone">) {
  const t = await getTranslations({ locale: guestLocale(guest), namespace: "Invite" });
  const text = t("whatsapp", { name: guest.name, link: inviteLink(guest) });
  const number = guest.phone.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// The invitation email, in the guest's language.
export async function inviteEmail(guest: Guest) {
  const locale = guestLocale(guest);
  const [t, hero, rsvp, format] = await Promise.all([
    getTranslations({ locale, namespace: "Invite" }),
    getTranslations({ locale, namespace: "Hero" }),
    getTranslations({ locale, namespace: "Rsvp" }),
    getFormatter({ locale }),
  ]);
  const link = inviteLink(guest);
  const { src, attachments } = await emailImages();
  const photo = src("couple");

  const subject = t("email.subject", event.couple);
  const greeting = t("email.greeting", { name: guest.name });
  const signoff = rsvp("email.signoff", event.couple);
  const body = [greeting, "", t("email.body"), "", `${t("email.button")}: ${link}`, "", t("email.footnote"), "", signoff].join("\n");

  const html = renderEmail({
    lang: locale,
    preview: t("email.preview"),
    kicker: hero("kicker"),
    ...event.couple,
    dateLine: event.date ? format.dateTime(new Date(event.date), { dateStyle: "long", timeZone: "UTC" }) : hero("dateSoon"),
    greeting,
    paragraphs: [t("email.body")],
    buttons: [{ label: t("email.button"), href: link }],
    footnote: t("email.footnote"),
    signoff,
    art: src("garland"),
    photo: photo ? { src: photo, alt: hero("photoAlt", event.couple) } : undefined,
    footerArt: src("roses"),
  });

  return { subject, body, html, images: attachments };
}
