import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";
import { Flourish } from "../_components/Flourish";

export async function RsvpCta() {
  const t = await getTranslations("Rsvp");
  const format = await getFormatter();

  return (
    <section className="overflow-x-clip px-4 py-14">
      <div className="glass reveal relative mx-auto max-w-xl rounded-[2rem] bg-gradient-to-br from-blush/70 via-white/40 to-sky/70 px-6 py-12 text-center">
        {/* Blush roses tucked into two corners of the card */}
        <Image
          src="/art/blush-roses.png"
          alt=""
          width={452}
          height={588}
          className="pointer-events-none absolute -top-10 -left-8 w-24 -rotate-12 select-none sm:-left-14 sm:w-32"
        />
        <Image
          src="/art/blush-roses.png"
          alt=""
          width={452}
          height={588}
          className="pointer-events-none absolute -right-8 -bottom-10 w-24 rotate-[168deg] select-none sm:-right-14 sm:w-32"
        />
        <h2 className="font-serif text-4xl">{t("title")}</h2>
        <Flourish className="my-5" />
        {event.rsvpDeadline && (
          <p className="text-muted">
            {t("deadline", {
              date: format.dateTime(new Date(event.rsvpDeadline), {
                dateStyle: "long",
                timeZone: "UTC",
              }),
            })}
          </p>
        )}
        <Link
          href="/rsvp"
          className="mt-6 inline-block rounded-full bg-primary px-10 py-3 font-medium text-paper shadow-lg shadow-primary/20 ring-1 ring-gold/40 hover:bg-primary-dark"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
