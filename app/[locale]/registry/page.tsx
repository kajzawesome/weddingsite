import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { localize } from "@/lib/localized";
import { registry } from "@/lib/registry";
import { Garland } from "../_components/Decor";
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
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-14">
      <Garland className="mb-2" />
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
      {/* One full-width card per category, so every card lines up on the same edges */}
      <div className="space-y-4">
        {registry.categories.map((category) => (
          <div key={category.id} className="glass reveal rounded-3xl px-6 py-7 text-center">
            <h3 className="font-serif text-3xl">{localize(category.title, locale)}</h3>
            <div className="mx-auto my-3 h-px w-10 bg-gold/60" />
            <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <li key={localize(item.name, "en")}>
                  {localize(item.name, locale)}
                  {item.note && (
                    <span className="block text-sm text-muted">{localize(item.note, locale)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Guests are welcome to give anything else they think we'd like */}
      <div className="reveal mx-auto mt-8 max-w-2xl text-center">
        <h3 className="font-serif text-2xl">{t("otherTitle")}</h3>
        <p className="mt-2 leading-relaxed text-muted">{t("otherBody")}</p>
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
