import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { localize } from "@/lib/localized";
import { Section } from "../_components/Section";

const cards = ["dance", "comeGo", "food", "sayHi"] as const;

export async function Reception() {
  const t = await getTranslations("Reception");
  const locale = await getLocale();
  const photo = event.receptionPhoto;

  return (
    <Section id="reception" title={t("title")}>
      {photo && (
        <div className="glass mx-auto mb-8 max-w-xs rounded-[2rem] p-1.5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.7rem]">
            <Image
              src={photo.src}
              alt={localize(photo.alt, locale)}
              fill
              sizes="320px"
              className="object-cover"
            />
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((key) => (
          <div key={key} className="glass rounded-3xl p-6 text-center">
            <h3 className="font-serif text-2xl">{t(`${key}.title`)}</h3>
            <div className="mx-auto my-3 h-px w-10 bg-gold/60" />
            <p className="leading-relaxed text-muted">{t(`${key}.body`)}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
