import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "../_components/ComingSoon";

// Placeholder until photo uploads (Phase 3). The wedding-day QR code will point here.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Share");
  return { title: t("title"), robots: { index: false } };
}

export default async function SharePage() {
  const t = await getTranslations("Share");
  return <ComingSoon title={t("title")} body={t("soon")} linkHref="/gallery" linkLabel={t("gallery")} />;
}
