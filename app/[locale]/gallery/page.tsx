import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "../_components/ComingSoon";

// Placeholder until the real gallery (Phase 4). Kept out of search engines.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Gallery");
  return { title: t("title"), robots: { index: false } };
}

export default async function GalleryPage() {
  const t = await getTranslations("Gallery");
  return <ComingSoon title={t("title")} body={t("soon")} linkHref="/share" linkLabel={t("share")} />;
}
