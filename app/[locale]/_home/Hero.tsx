import { getFormatter, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";
import { Flourish } from "../_components/Flourish";
import { DaysToGo } from "./DaysToGo";
import { HeroPhoto } from "./HeroPhoto";

// Full-screen photo with our names on top. It's "sticky", so it stays pinned
// while the next section (a sheet) scrolls up over it. Must sit inside a
// wrapper together with that sheet (see page.tsx).
export async function Hero() {
  const t = await getTranslations("Hero");
  const format = await getFormatter();
  const { video, photo } = event.hero;
  const hasMedia = Boolean(video || photo);

  // Dates are stored as "YYYY-MM-DD"; format in UTC so the day never shifts.
  const date = event.date
    ? format.dateTime(new Date(event.date), { dateStyle: "long", timeZone: "UTC" })
    : t("dateSoon");

  return (
    <div className="sticky top-0 h-[100svh] overflow-hidden sm:h-[min(100svh,66vw)]">
      {hasMedia && (
        <div className="absolute inset-0">
          {photo && <HeroPhoto tall={photo} wide={event.hero.photoWide} alt={t("photoAlt", event.couple)} />}
          {video && (
            // Hidden for guests who ask for reduced motion; they see the photo instead.
            <video
              src={video}
              poster={photo ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
            />
          )}
        </div>
      )}
      {/* Darkens the top and bottom slightly so white text stays readable on any photo */}
      {hasMedia && <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/10 to-ink/60" />}

      <div
        className={`relative flex h-full flex-col items-center justify-end px-4 pb-24 text-center sm:justify-center sm:pb-0 ${
          hasMedia ? "text-paper [text-shadow:0_2px_16px_rgb(0_0_0/0.35)]" : ""
        }`}
      >
        <p className="text-xs uppercase tracking-[0.35em]">{t("kicker")}</p>
        <h1 className="mt-4 flex flex-col items-center font-serif text-5xl uppercase tracking-[0.14em] sm:text-7xl">
          <span>{event.couple.first}</span>
          <span className="font-script text-6xl normal-case tracking-normal text-[#e9cf9c] sm:text-7xl">&amp;</span>
          <span>{event.couple.second}</span>
        </h1>
        <Flourish className="my-5" />
        <p className="font-serif text-2xl">{date}</p>
        {event.date && <DaysToGo date={event.date} />}
        <Link
          href="/rsvp"
          className="glass mt-7 rounded-full px-10 py-3 font-medium text-ink [text-shadow:none] hover:bg-white/80"
        >
          {t("rsvp")}
        </Link>
      </div>
    </div>
  );
}
