import { getFormatter, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";

export async function RsvpCta() {
  const t = await getTranslations("Rsvp");
  const format = await getFormatter();

  return (
    <section className="bg-sage px-4 py-16 text-center text-paper">
      <h2 className="font-serif text-4xl">{t("title")}</h2>
      {event.rsvpDeadline && (
        <p className="mt-2 opacity-90">
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
        className="mt-8 inline-block rounded-full bg-paper px-8 py-3 font-medium text-sage-dark shadow-sm hover:bg-cream"
      >
        {t("button")}
      </Link>
    </section>
  );
}
