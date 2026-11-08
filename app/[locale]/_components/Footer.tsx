import { getTranslations } from "next-intl/server";
import { event } from "@/config/event";

export async function Footer() {
  const t = await getTranslations("Footer");
  return (
    <footer className="border-t border-line py-8 text-center text-sm text-muted">
      {t("madeWith", event.couple)}
    </footer>
  );
}
