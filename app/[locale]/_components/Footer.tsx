import { getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Meadow } from "./Decor";

export async function Footer() {
  const t = await getTranslations("Footer");
  return (
    // relative z-10 keeps the footer above the pinned photos as the page ends
    <footer className="sheet relative z-10 text-center text-sm text-muted">
      <Meadow />
      <p className="bg-cream pt-2 pb-8 font-serif text-lg">
        {t("madeWith", event.couple)}
      </p>
    </footer>
  );
}
