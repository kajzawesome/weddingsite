import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Flourish } from "../_components/Flourish";
import { RsvpForm } from "./RsvpForm";

// RSVP page holds guest info, so keep it out of search engines.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Rsvp");
  return { title: t("button"), robots: { index: false } };
}

export default async function RsvpPage() {
  const t = await getTranslations("Rsvp");
  const format = await getFormatter();

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <div className="text-center">
        <h1 className="font-serif text-5xl">{t("title")}</h1>
        <Flourish className="my-5" />
        <p className="text-muted">
          {event.rsvpDeadline
            ? t("deadline", {
                date: format.dateTime(new Date(event.rsvpDeadline), { dateStyle: "long", timeZone: "UTC" }),
              })
            : t("intro")}
        </p>
      </div>
      <div className="glass mt-8 rounded-[2rem] p-6 sm:p-8">
        <RsvpForm />
      </div>
    </div>
  );
}
