import { getTranslations } from "next-intl/server";
import { event, type Venue } from "@/config/event";
import { Section } from "../_components/Section";

export async function Schedule() {
  const t = await getTranslations("Schedule");
  const parts: { label: string; note?: string; venue: Venue }[] = [
    { label: t("sealing"), note: t("sealingNote"), venue: event.sealing },
    { label: t("ringCeremony"), note: t("ringNote"), venue: event.ringCeremony },
    { label: t("reception"), note: t("receptionNote"), venue: event.reception },
  ];

  return (
    <Section id="schedule" title={t("title")}>
      <div className="grid gap-4 sm:grid-cols-3">
        {parts.map(({ label, note, venue }) => (
          <div key={label} className="glass rounded-3xl p-6 text-center">
            <h3 className="font-serif text-2xl">{label}</h3>
            {note && <p className="mt-1 text-sm text-muted">{note}</p>}
            <p className="mt-2 text-gold">{venue.time ?? t("timeSoon")}</p>
            <p className="mt-3">{venue.name ?? t("venueSoon")}</p>
            {venue.address && <p className="text-sm text-muted">{venue.address}</p>}
            {venue.mapUrl && (
              <a
                href={venue.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-primary-dark underline underline-offset-4"
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
