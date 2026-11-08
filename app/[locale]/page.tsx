import { getLocale, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { localize } from "@/lib/localized";
import { Garland } from "./_components/Decor";
import { EnvelopeIntro } from "./_home/EnvelopeIntro";
import { Faq } from "./_home/Faq";
import { Hero } from "./_home/Hero";
import { PhotoBreak } from "./_home/PhotoBreak";
import { Reception } from "./_home/Reception";
import { RsvpCta } from "./_home/RsvpCta";
import { Schedule } from "./_home/Schedule";
import { Story } from "./_home/Story";

// The "sheet": a section of the page that slides up over the pinned photo before it.
const sheet = "sheet relative z-10 overflow-x-clip";

export default async function HomePage() {
  const t = await getTranslations("Hero");
  const locale = await getLocale();
  const [first, second] = event.photoBreaks;

  return (
    <>
      <EnvelopeIntro
        first={event.couple.first}
        second={event.couple.second}
        kicker={t("kicker")}
        skip={t("skip")}
      />

      {/* Each wrapper = a pinned photo + the sheet that slides over it */}
      <div className="relative">
        <Hero />
        <div className={sheet}>
          <Garland className="pt-12 sm:pt-16" />
          <Story />
        </div>
      </div>

      <div className="relative">
        <PhotoBreak {...first} alt={localize(first.alt, locale)} caption={first.caption && localize(first.caption, locale)} />
        <div className={sheet}>
          <Schedule />
          <Reception />
        </div>
      </div>

      <div className="relative">
        <PhotoBreak {...second} alt={localize(second.alt, locale)} caption={second.caption && localize(second.caption, locale)} />
        <div className={sheet}>
          <Faq />
          <RsvpCta />
        </div>
      </div>
    </>
  );
}
