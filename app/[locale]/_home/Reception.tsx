import { getTranslations } from "next-intl/server";
import { Section } from "../_components/Section";

const cards = ["dance", "comeGo", "food", "sayHi"] as const;

export async function Reception() {
  const t = await getTranslations("Reception");

  return (
    <Section id="reception" title={t("title")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((key) => (
          <div key={key} className="glass reveal rounded-3xl p-6 text-center">
            <h3 className="font-serif text-2xl">{t(`${key}.title`)}</h3>
            <div className="mx-auto my-3 h-px w-10 bg-gold/60" />
            <p className="leading-relaxed text-muted">{t(`${key}.body`)}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
