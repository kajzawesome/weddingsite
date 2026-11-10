import { getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { EnvelopeIntro } from "./_home/EnvelopeIntro";
import { HomeSections } from "./_home/HomeSections";

export default async function HomePage() {
  const t = await getTranslations("Hero");

  return (
    <>
      <EnvelopeIntro
        first={event.couple.first}
        second={event.couple.second}
        kicker={t("kicker")}
        skip={t("skip")}
      />
      <HomeSections />
    </>
  );
}
