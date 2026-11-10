import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { backupLinks, codeIsSetUp, galleryAccess } from "@/lib/gallery";
import { Flourish } from "../../_components/Flourish";
import { UnlockForm } from "../UnlockForm";

// For KAJ, Tayna and a trusted friend: sign in once on a phone, and every photo
// in the gallery gets a Hide button. Also the "download everything" backup.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Gallery.admin");
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminPage() {
  const t = await getTranslations("Gallery.admin");
  return (
    <div className="mx-auto max-w-md px-4 pt-24 pb-14 text-center">
      <h1 className="font-serif text-5xl">{t("title")}</h1>
      <Flourish className="my-5" />
      <Suspense fallback={<div className="h-48" />}>
        <AdminBody />
      </Suspense>
    </div>
  );
}

async function AdminBody() {
  const t = await getTranslations("Gallery.admin");
  const { admin } = await galleryAccess();

  if (!admin) {
    return (
      <div className="glass rounded-[2rem] p-6 sm:p-8">
        <p className="mb-6 leading-relaxed text-muted">{codeIsSetUp("admin") ? t("intro") : t("notSetUp")}</p>
        {codeIsSetUp("admin") && <UnlockForm role="admin" />}
      </div>
    );
  }

  const backup = backupLinks();
  const button = "block rounded-full bg-primary px-6 py-3 font-medium text-paper ring-1 ring-gold/40 hover:bg-primary-dark";
  return (
    <div className="space-y-6">
      <div className="glass rounded-[2rem] p-6">
        <p className="leading-relaxed text-muted">{t("signedIn")}</p>
        <Link href="/gallery" className={`${button} mt-5`}>
          {t("toGallery")}
        </Link>
        <Link href="/invites" className={`${button} mt-3`}>
          {t("toInvites")}
        </Link>
      </div>
      <div className="glass rounded-[2rem] p-6">
        <h2 className="font-serif text-3xl">{t("backupTitle")}</h2>
        {backup ? (
          <div className="mt-4 space-y-3">
            <a href={backup.photos} className={button}>{t("backupPhotos")}</a>
            <a href={backup.videos} className={button}>{t("backupVideos")}</a>
            <p className="text-sm text-muted">{t("backupHint")}</p>
          </div>
        ) : (
          <p className="mt-3 text-muted">{t("backupDemo")}</p>
        )}
      </div>
    </div>
  );
}
