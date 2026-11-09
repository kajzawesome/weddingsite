import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { event } from "@/config/event";
import { galleryAccess, galleryIsOpen, listPhotos } from "@/lib/gallery";
import type { GalleryItem } from "@/lib/galleryTypes";
import { localize } from "@/lib/localized";
import { Garland } from "../_components/Decor";
import { Flourish } from "../_components/Flourish";
import { Section } from "../_components/Section";
import { Gallery } from "./Gallery";
import { GalleryCountdown } from "./GalleryRefresh";
import { PhotoIdeas } from "./PhotoIdeas";
import { PhotoMarquee } from "./PhotoMarquee";
import { UnlockForm } from "./UnlockForm";

// Holds guests' photos, so keep it out of search engines.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Gallery");
  return { title: t("title"), robots: { index: false } };
}

/*
  Three versions of this page:
  1. Before the wedding: countdown, engagement photos, how sharing works.
  2. Open, no code yet: 5 preview photos and the code box.
  3. Open, code entered: the full album.
  Which one depends on the time and the guest's cookie, so it's worked out per
  visit inside <Suspense> (with Cache Components, anything per-request goes there).
*/
export default function GalleryPage() {
  return (
    <div className="overflow-x-clip pt-24">
      <Suspense fallback={<div className="min-h-[70dvh]" />}>
        <GalleryBody />
      </Suspense>
    </div>
  );
}

async function GalleryBody() {
  const access = await galleryAccess();
  // Admins can look early, e.g. to check test uploads before the day.
  if (!galleryIsOpen() && !access.admin) return <BeforeOpen />;

  const all = await listPhotos();
  const photos = access.admin ? all : all.filter((p) => !p.hidden);
  if (!access.guest) return <Preview photos={photos} />;
  return <Open photos={photos} admin={access.admin} />;
}

async function Title({ intro }: { intro: string }) {
  const t = await getTranslations("Gallery");
  return (
    <div className="px-4 text-center">
      <Garland className="mb-2" />
      <h1 className="font-serif text-5xl">{t("title")}</h1>
      <Flourish className="my-5" />
      <p className="mx-auto max-w-prose leading-relaxed text-muted">{intro}</p>
    </div>
  );
}

const steps = ["scan", "name", "share"] as const;

async function BeforeOpen() {
  const t = await getTranslations("Gallery");
  const locale = await getLocale();
  const countTo = event.startsAt ?? event.date;

  return (
    <>
      <Title intro={t("intro")} />

      {countTo && (
        <div className="mx-auto mt-10 max-w-md px-4">
          <div className="glass reveal rounded-[2rem] px-6 py-6 text-center">
            <p className="mb-3 text-xs tracking-[0.3em] text-gold uppercase">{t("countdownTitle")}</p>
            <GalleryCountdown to={countTo} />
          </div>
        </div>
      )}

      <Section title={t("engagementTitle")}>
        {/* Break out of the centred column so the film strip runs edge to edge */}
        <div className="mx-[calc(50%-50vw)]">
          <PhotoMarquee
            photos={event.engagementPhotos.map((photo) => ({ ...photo, alt: localize(photo.alt, locale) }))}
          />
        </div>
      </Section>

      <Section title={t("dayTitle")}>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((key, i) => (
            <div key={key} className="glass reveal rounded-3xl p-6 text-center">
              <p className="font-serif text-4xl text-gold">{i + 1}</p>
              <h3 className="mt-1 font-serif text-2xl">{t(`steps.${key}.title`)}</h3>
              <p className="mt-2 leading-relaxed text-muted">{t(`steps.${key}.body`)}</p>
            </div>
          ))}
        </div>
        <p className="reveal mt-6 text-center text-muted">{t("opens")}</p>
      </Section>

      <Section title={t("ideasTitle")}>
        <div className="reveal">
          <PhotoIdeas />
        </div>
      </Section>
    </>
  );
}

// Public teaser: the 5 newest photos, then the code box for the rest.
async function Preview({ photos }: { photos: GalleryItem[] }) {
  const t = await getTranslations("Gallery");
  const teaser = photos.filter((p) => p.kind === "image").slice(0, 5);

  return (
    <div className="pb-14">
      <Title intro={t("openIntro")} />
      {teaser.length > 0 && (
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-2 px-4 sm:grid-cols-5">
          {teaser.map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- already resized by Cloudinary / the image optimiser
            <img
              key={photo.id}
              src={photo.thumb}
              alt=""
              className={`aspect-square w-full rounded-2xl object-cover shadow-md shadow-ink/5 ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}
            />
          ))}
        </div>
      )}
      <div className="mx-auto mt-8 max-w-md px-4">
        <div className="glass rounded-[2rem] p-6 text-center sm:p-8">
          <h2 className="font-serif text-3xl">{t("previewTitle")}</h2>
          <p className="mt-2 mb-6 leading-relaxed text-muted">{t("previewBody", { count: photos.length })}</p>
          <UnlockForm role="guest" />
        </div>
      </div>
    </div>
  );
}

async function Open({ photos, admin }: { photos: GalleryItem[]; admin: boolean }) {
  const t = await getTranslations("Gallery");
  return (
    <div className="pb-14">
      <Title intro={t("openIntro")} />
      <div className="mx-auto mt-10 max-w-6xl px-4">
        <Gallery initial={photos} admin={admin} demo={event.gallery.demo} />
      </div>
    </div>
  );
}
