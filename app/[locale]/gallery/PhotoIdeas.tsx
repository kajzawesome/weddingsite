import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const ideas = ["grandparents", "danceFloor", "tableSelfie", "firstDance", "laugh", "details"] as const;

// Shot ideas to nudge guests towards new angles. Styled as plain text (no
// boxes) so they don't look tappable; the upload button is the only button.
export function PhotoIdeas({ title }: { title?: boolean }) {
  const t = useTranslations("Gallery");
  return (
    <div className="text-center">
      {title && <p className="text-xs tracking-[0.3em] text-gold uppercase">{t("ideasTitle")}</p>}
      <ul className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-x-5 gap-y-1.5 font-serif text-lg text-muted italic">
        {ideas.map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span aria-hidden className="size-1.5 rotate-45 bg-gold/70" />
            {t(`ideas.${key}`)}
          </li>
        ))}
      </ul>
      <Link
        href="/share"
        className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-medium text-paper not-italic ring-1 ring-gold/40 hover:bg-primary-dark"
      >
        {t("share")}
      </Link>
    </div>
  );
}
