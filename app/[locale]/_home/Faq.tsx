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
    { q: t("kids.q"), a: t("kids.a") },
    { q: t("photos.q"), a: t("photos.a") },
    {
      q: t("gifts.q"),
      a: (
        <>
          {t("gifts.a")}{" "}
          <Link href="/registry" className="text-sage-dark underline underline-offset-4">
            {t("gifts.link")}
          </Link>
        </>
      ),
    },
  ];

  return (
    <Section id="faq" title={t("title")}>
      {/* <details> gives an accordion with no JavaScript */}
      <div className="divide-y divide-line rounded-2xl border border-line bg-paper">
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
