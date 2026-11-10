import { getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { getGuest } from "@/lib/sheet";
import { shareCard } from "../../_og/shareCard";

// A personal invite's link preview: the usual card plus "For Ana".
export const alt = `${event.couple.first} & ${event.couple.second}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const [guest, t] = await Promise.all([getGuest(slug), getTranslations({ locale, namespace: "Invite" })]);
  return shareCard(locale, guest ? t("to", { name: guest.name }) : undefined);
}
