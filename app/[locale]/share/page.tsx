import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Garland } from "../_components/Decor";
import { Flourish } from "../_components/Flourish";
import { ShareUploader } from "./ShareUploader";

// The page the table QR codes open. Kept out of search engines.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Share");
  return { title: t("title"), robots: { index: false } };
}

export default async function SharePage() {
  const t = await getTranslations("Share");
  return (
    <div className="mx-auto max-w-xl px-4 pt-24 pb-14">
      <div className="text-center">
        <Garland className="mb-2" />
        <h1 className="font-serif text-5xl">{t("title")}</h1>
        <Flourish className="my-5" />
        <p className="text-muted">{t("intro")}</p>
      </div>
      <div className="glass mt-8 rounded-[2rem] p-6 sm:p-8">
        <ShareUploader />
      </div>
    </div>
  );
}
