import { getTranslations } from "next-intl/server";
import { event, type Venue } from "@/config/event";
import { Section } from "../_components/Section";

export async function Schedule() {
  const t = await getTranslations("Schedule");
  const parts: { label: string; venue: Venue }[] = [
    { label: t("ceremony"), venue: event.ceremony },
    { label: t("reception"), venue: event.reception },
  ];

  return (
    <Section id="schedule" title={t("title")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {parts.map(({ label, venue }) => (
          <div key={label} className="rounded-2xl border border-line bg-paper p-6 text-center">
            <h3 className="font-serif text-2xl">{label}</h3>
            <p className="mt-2 text-gold">{venue.time ?? t("timeSoon")}</p>
            <p className="mt-3">{venue.name ?? t("venueSoon")}</p>
            {venue.address && <p className="text-sm text-muted">{venue.address}</p>}
            {venue.mapUrl && (
              <a
                href={venue.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-sage-dark underline underline-offset-4"
              >
                {t("map")}
              </a>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
