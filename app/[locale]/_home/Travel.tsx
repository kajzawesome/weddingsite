import { getTranslations } from "next-intl/server";
import { Section } from "../_components/Section";

export async function Travel() {
  const t = await getTranslations("Travel");
  return (
    <Section id="travel" title={t("title")}>
      <p className="mx-auto max-w-prose text-center leading-relaxed text-muted">
        {t("body")}
      </p>
    </Section>
  );
}
