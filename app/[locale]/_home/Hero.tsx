import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";
import { Flourish } from "../_components/Flourish";
import { DaysToGo } from "./DaysToGo";
import { HeroPhoto } from "./HeroPhoto";

const sections = [
  { href: "#story", key: "story" },
  { href: "#schedule", key: "schedule" },
  { href: "#reception", key: "reception" },
  { href: "#faq", key: "faq" },
] as const;

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
    <section
      className={`relative overflow-hidden px-4 pt-14 pb-12 text-center ${
        hasMedia ? "" : "flex min-h-[75dvh] flex-col justify-center"
      }`}
    >
      {event.decor.corner && (
        <Image
          src={event.decor.corner}
          alt=""
          width={320}
          height={320}
          className="pointer-events-none absolute -top-6 -right-10 w-44 select-none sm:w-72"
          priority
        />
      )}

      <p className="text-xs uppercase tracking-[0.35em] text-muted">{t("kicker")}</p>
      <h1 className="mt-5 flex flex-col items-center font-serif text-5xl uppercase tracking-[0.14em] sm:flex-row sm:justify-center sm:gap-6 sm:text-6xl">
        <span>{event.couple.first}</span>
        <span className="font-script text-6xl normal-case tracking-normal text-gold sm:text-7xl">&amp;</span>
        <span>{event.couple.second}</span>
      </h1>
      <Flourish className="my-6" />
      <p className="font-serif text-2xl">{date}</p>
      {event.date && <DaysToGo date={event.date} />}

      <nav className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.2em] text-muted">
        {sections.map(({ href, key }) => (
          <a key={key} href={href} className="hover:text-primary-dark">
            {t(`nav.${key}`)}
          </a>
        ))}
        <Link href="/rsvp" className="font-medium text-primary-dark hover:text-primary">
          {t("nav.rsvp")}
        </Link>
      </nav>

      {hasMedia && (
        <div className="glass mx-auto mt-10 max-w-4xl rounded-[2rem] p-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] sm:aspect-[16/9]">
            {photo && (
              <HeroPhoto
                tall={photo}
                wide={event.hero.photoWide}
                alt={t("photoAlt", event.couple)}
              />
            )}
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
        </div>
      )}
    </section>
  );
}
