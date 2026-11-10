import { getLocale } from "next-intl/server";
import { event } from "@/config/event";
import { localize } from "@/lib/localized";
import { Garland } from "../_components/Decor";
import { Faq } from "./Faq";
import { Hero } from "./Hero";
import { PhotoBreak } from "./PhotoBreak";
import { Reception } from "./Reception";
import { RsvpCta } from "./RsvpCta";
import { Schedule } from "./Schedule";
import { Story } from "./Story";

// The "sheet": a section of the page that slides up over the pinned photo before it.
const sheet = "sheet relative z-10 overflow-x-clip";

// Everything on the invite below the opening envelope. Used by the home page
// and by each guest's personal invite (/i/[slug]).
export async function HomeSections() {
  const locale = await getLocale();
  const [first, second] = event.photoBreaks;

  return (
    <>
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
