import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { Section } from "../_components/Section";

export async function Faq() {
  const t = await getTranslations("Faq");
  const locale = await getLocale();

  const items: { q: string; a: ReactNode }[] = [
    {
      q: t("dressCode.q"),
      a: event.dressCode ? localize(event.dressCode, locale) : t("dressCode.soon"),
    },
    { q: t("sealing.q"), a: t("sealing.a") },
    { q: t("food.q"), a: t("food.a") },
    { q: t("airport.q"), a: t("airport.a") },
    {
      q: t("hotels.q"),
      a: (
        <>
          {t("hotels.a")}{" "}
          <a
            href="https://www.google.com/maps/search/hotels+near+Provo,+UT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-dark underline underline-offset-4"
          >
            {t("hotels.link")}
          </a>
        </>
      ),
    },
    { q: t("kids.q"), a: t("kids.a") },
    { q: t("photos.q"), a: t("photos.a") },
    {
      q: t("gifts.q"),
      a: (
        <>
          {t("gifts.a")}{" "}
          <Link href="/registry" className="text-primary-dark underline underline-offset-4">
            {t("gifts.link")}
          </Link>
        </>
      ),
    },
  ];

  return (
    <Section id="faq" title={t("title")}>
      {/* <details> gives an accordion with no JavaScript */}
      <div className="glass reveal mx-auto max-w-3xl divide-y divide-white/70 rounded-3xl">
        {items.map(({ q, a }) => (
          <details key={q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {q}
              <span className="text-gold transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
