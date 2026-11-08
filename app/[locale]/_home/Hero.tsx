import { getFormatter, getTranslations } from "next-intl/server";
import { event } from "@/config/event";

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
    <section className="relative flex min-h-[85dvh] items-center justify-center overflow-hidden px-4 text-center">
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- full-bleed background
        <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
      {hasMedia && <div className="absolute inset-0 bg-ink/40" />}

      <div className={`relative ${hasMedia ? "text-paper" : ""}`}>
        <p className="mb-4 text-xs uppercase tracking-[0.3em]">{t("kicker")}</p>
        <h1 className="font-serif text-6xl leading-tight sm:text-7xl">
          {event.couple.first}
          <span className="block text-gold">&amp;</span>
          {event.couple.second}
        </h1>
        <div className="mx-auto my-6 h-px w-16 bg-gold" />
        <p className="font-serif text-2xl">{date}</p>
        <a
          href="#story"
          className="mt-10 inline-block text-sm underline underline-offset-4 opacity-80 hover:opacity-100"
        >
          {t("scroll")}
        </a>
      </div>
    </section>
  );
}
