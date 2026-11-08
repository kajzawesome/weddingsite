import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { localize } from "@/lib/localized";
import { registry } from "@/lib/registry";
import { Flourish } from "../_components/Flourish";
import { Funds } from "./Funds";
import { Give } from "./Give";
import { StoreButtons } from "./StoreButtons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Registry");
  return { title: t("title") };
}

export default async function RegistryPage() {
  const t = await getTranslations("Registry");
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-center font-serif text-5xl">{t("title")}</h1>
      <Flourish className="mt-4" />
      <p className="mx-auto mt-4 max-w-prose text-center leading-relaxed text-muted">
        {t("intro")}
      </p>

      <h2 className="mt-12 mb-4 text-center text-xs uppercase tracking-[0.3em] text-muted">
        {t("storesTitle")}
      </h2>
      <StoreButtons />

      <h2 className="mt-16 mb-6 text-center font-serif text-4xl">{t("ideasTitle")}</h2>
      <div className="gap-4 sm:columns-2">
        {/* CSS columns stack cards like a masonry wall, with no gaps under short cards */}
        {registry.categories.map((category) => (
          <div key={category.id} className="glass mb-4 break-inside-avoid rounded-3xl p-6">
            <h3 className="font-serif text-2xl">{localize(category.title, locale)}</h3>
            <ul className="mt-3 space-y-2">
              {category.items.map((item) => (
                <li key={localize(item.name, "en")} className="flex gap-2">
                  <span className="text-gold" aria-hidden>
                    ·
                  </span>
                  <span>
                    {localize(item.name, locale)}
                    {item.note && (
                      <span className="block text-sm text-muted">
                        {localize(item.note, locale)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {registry.cashFunds.length > 0 && (
        <div className="mt-16">
          <h2 className="text-center font-serif text-4xl">{t("fundsTitle")}</h2>
          <p className="mt-3 mb-6 text-center text-muted">{t("fundsIntro")}</p>
          <Funds />
        </div>
      )}
      <Give />
    </div>
  );
}
