import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Placeholder until the real RSVP form arrives in Phase 2.
export default async function RsvpPage() {
  const t = await getTranslations("Rsvp");
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-4xl">{t("soonTitle")}</h1>
      <p className="mt-4 text-muted">{t("soonBody")}</p>
      <Link href="/" className="mt-8 inline-block text-sage-dark underline underline-offset-4">
        {t("back")}
      </Link>
    </div>
  );
}
