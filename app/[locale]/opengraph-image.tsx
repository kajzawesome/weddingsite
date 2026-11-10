import { event } from "@/config/event";
import { shareCard } from "./_og/shareCard";

// Link preview image for every page (see _og/shareCard.tsx).
export const alt = `${event.couple.first} & ${event.couple.second}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return shareCard(locale);
}
