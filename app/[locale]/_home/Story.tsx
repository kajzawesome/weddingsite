import { getTranslations } from "next-intl/server";
import { Section } from "../_components/Section";

export async function Story() {
  const t = await getTranslations("Story");
  return (
    <Section id="story" title={t("title")}>
      <p className="mx-auto max-w-prose text-center text-lg leading-relaxed text-muted">
        {t("body")}
      </p>
    </Section>
  );
}
