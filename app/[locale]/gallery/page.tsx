import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/localized";
import { Garland } from "../_components/Decor";
import { Flourish } from "../_components/Flourish";
import { Section } from "../_components/Section";
import { PhotoMarquee } from "./PhotoMarquee";

// Will hold guests' photos once the wedding starts, so keep it out of search engines.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Gallery");
  return { title: t("title"), robots: { index: false } };
}

const steps = ["scan", "name", "share"] as const;
const ideas = ["grandparents", "danceFloor", "tableSelfie", "firstDance", "laugh", "details"] as const;

export default async function GalleryPage() {
  const t = await getTranslations("Gallery");
  const locale = await getLocale();

  return (
    <div className="overflow-x-clip pt-24">
      <div className="px-4 text-center">
        <Garland className="mb-2" />
        <h1 className="font-serif text-5xl">{t("title")}</h1>
        <Flourish className="my-5" />
        <p className="mx-auto max-w-prose leading-relaxed text-muted">{t("intro")}</p>
      </div>

      <Section title={t("engagementTitle")}>
        {/* Break out of the centred column so the film strip runs edge to edge */}
        <div className="mx-[calc(50%-50vw)]">
          <PhotoMarquee
            photos={event.engagementPhotos.map((photo) => ({ ...photo, alt: localize(photo.alt, locale) }))}
          />
        </div>
      </Section>

      <Section title={t("dayTitle")}>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((key, i) => (
            <div key={key} className="glass reveal rounded-3xl p-6 text-center">
              <p className="font-serif text-4xl text-gold">{i + 1}</p>
              <h3 className="mt-1 font-serif text-2xl">{t(`steps.${key}.title`)}</h3>
              <p className="mt-2 leading-relaxed text-muted">{t(`steps.${key}.body`)}</p>
            </div>
          ))}
        </div>
        <p className="reveal mt-6 text-center text-muted">{t("opens")}</p>
      </Section>

      <Section title={t("ideasTitle")}>
        <ul className="reveal mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
          {ideas.map((key) => (
            <li key={key} className="glass rounded-full px-4 py-2">
              {t(`ideas.${key}`)}
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <Link
            href="/share"
            className="inline-block rounded-full bg-primary px-8 py-3 font-medium text-paper ring-1 ring-gold/40 hover:bg-primary-dark"
          >
            {t("share")}
          </Link>
        </div>
      </Section>
    </div>
  );
}
