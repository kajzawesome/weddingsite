import { getTranslations } from "next-intl/server";
import { Flourish } from "../_components/Flourish";
import { Section } from "../_components/Section";

// Paragraph keys from messages/*.json → "Story". Add a key here to add a paragraph.
const howWeMet = ["p1", "p2", "p3", "p4"] as const;
const proposal = ["p5", "p6"] as const;

export async function Story() {
  const t = await getTranslations("Story");

  return (
    <Section id="story" title={t("title")}>
      <div className="mx-auto max-w-prose space-y-4 text-center text-lg leading-relaxed text-muted">
        {howWeMet.map((key) => (
          <p key={key} className="reveal">
            {t(key)}
          </p>
        ))}
        <div className="reveal pt-8">
          <Flourish />
          <h3 className="mt-4 font-serif text-4xl text-ink">{t("proposalTitle")}</h3>
        </div>
        {proposal.map((key) => (
          <p key={key} className="reveal">
            {t(key)}
          </p>
        ))}
      </div>
    </Section>
  );
}
