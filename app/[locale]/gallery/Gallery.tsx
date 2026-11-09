"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/galleryTypes";
import { setPhotoHidden } from "./actions";
import { useHearts } from "./hearts";
import { EyeIcon, HeartIcon, PlayIcon } from "./Icons";
import { Lightbox } from "./Lightbox";
import { PhotoIdeas } from "./PhotoIdeas";
import { downloadZip } from "./zip";

const PAGE = 60; // photos added to the grid at a time as the guest scrolls
const REFRESH_MS = 30_000;

/*
  The full shared album: a masonry grid (photos keep their shape, packed into
  columns), newest first. While the page is open it checks for new uploads every
  30 seconds, so during the wedding photos appear on their own.
*/
export function Gallery({ initial, admin, demo }: { initial: GalleryItem[]; admin: boolean; demo: boolean }) {
  const t = useTranslations("Gallery");
  const { hearts, toggle } = useHearts();
  const [photos, setPhotos] = useState(initial);
  const [filter, setFilter] = useState<"all" | "hearts">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [zip, setZip] = useState<{ done: number; total: number } | null>(null);
  const [zipFailed, setZipFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // Live refresh: only while the page is on screen, and right away when the guest comes back to it.
  useEffect(() => {
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/gallery", { cache: "no-store" });
        if (res.ok) setPhotos(((await res.json()) as { photos: GalleryItem[] }).photos);
      } catch {} // no signal: keep what we have
    };
    const timer = setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  const list = filter === "hearts" ? photos.filter((p) => hearts.includes(p.id)) : photos;

  // Show more photos when the guest scrolls near the bottom.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setShown((n) => n + PAGE),
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [list.length]);

  // The viewer tracks the photo by id, so new uploads arriving at the top don't move it.
  const openIndex = openId ? list.findIndex((p) => p.id === openId) : -1;
  const onIndex = useCallback((i: number | null) => setOpenId(i === null ? null : (list[i]?.id ?? null)), [list]);

  async function toggleHidden(item: GalleryItem) {
    const hidden = !item.hidden;
    const set = (value: boolean) => setPhotos((all) => all.map((p) => (p.id === item.id ? { ...p, hidden: value } : p)));
    set(hidden); // show the change straight away, undo it if the server says no
    const { ok } = await setPhotoHidden({ id: item.id, kind: item.kind, hidden });
    if (!ok) set(!hidden);
  }

  async function downloadHearted() {
    const items = list;
    setZipFailed(false);
    setZip({ done: 0, total: items.length });
    try {
      await downloadZip(items, "our-wedding-favourites.zip", (done) => setZip({ done, total: items.length }));
    } catch {
      setZipFailed(true);
    } finally {
      setZip(null);
    }
  }

  const tab = (active: boolean) =>
    `rounded-full px-5 py-2 text-sm font-medium transition ${active ? "bg-primary text-paper" : "text-ink hover:bg-white/60"}`;

  return (
    <div>
      {demo && <p className="mb-6 rounded-2xl bg-sky/70 px-4 py-3 text-center text-sm">{t("demo")}</p>}

      <div className="mb-10">
        <PhotoIdeas title />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <div className="glass flex rounded-full p-1" role="group">
          <button type="button" className={tab(filter === "all")} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            {t("all", { count: photos.length })}
          </button>
          <button type="button" className={tab(filter === "hearts")} aria-pressed={filter === "hearts"} onClick={() => setFilter("hearts")}>
            {t("hearts", { count: photos.filter((p) => hearts.includes(p.id)).length })}
          </button>
        </div>
        {filter === "hearts" && list.length > 0 && (
          <button
            type="button"
            onClick={downloadHearted}
            disabled={zip !== null}
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-paper hover:bg-gold/90 disabled:opacity-70"
          >
            {zip ? t("preparing", zip) : t("downloadHearts", { count: list.length })}
          </button>
        )}
      </div>
      {zipFailed && <p className="mb-4 text-center text-sm text-rose" role="alert">{t("downloadFailed")}</p>}

      {list.length === 0 ? (
        <p className="py-16 text-center text-muted">{filter === "hearts" ? t("emptyHearts") : t("emptyAll")}</p>
      ) : (
        <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {list.slice(0, shown).map((item) => {
            const hearted = hearts.includes(item.id);
            const label = item.by ? t(item.kind === "video" ? "videoBy" : "photoBy", { name: item.by }) : t("title");
            return (
              <li key={item.id} className="relative mb-3 break-inside-avoid">
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  aria-label={label}
                  className={`block w-full overflow-hidden rounded-2xl bg-white/50 shadow-md shadow-ink/5 ${item.hidden ? "opacity-40" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- already resized by Cloudinary / the image optimiser */}
                  <img
                    src={item.thumb}
                    alt=""
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full"
                  />
                  {item.kind === "video" && (
                    <span className="absolute top-2 left-2 grid size-8 place-items-center rounded-full bg-ink/50 text-white">
                      <PlayIcon className="size-4" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={hearted}
                  aria-label={hearted ? t("unheart") : t("heart")}
                  className={`absolute right-2 bottom-2 grid size-10 place-items-center rounded-full bg-white/80 shadow ${hearted ? "text-rose" : "text-ink/70"}`}
                >
                  <HeartIcon filled={hearted} />
                </button>

                {admin && (
                  <button
                    type="button"
                    onClick={() => toggleHidden(item)}
                    className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs font-medium shadow"
                  >
                    <EyeIcon off={!item.hidden} />
                    {item.hidden ? t("admin.unhide") : t("admin.hide")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {shown < list.length && <div ref={sentinel} className="h-10" />}

      <p className="mt-8 text-center text-sm text-muted">{t("liveNote")}</p>

      {openIndex >= 0 && (
        <Lightbox
          items={list}
          index={openIndex}
          onIndex={onIndex}
          hearted={hearts.includes(list[openIndex].id)}
          onHeart={() => toggle(list[openIndex].id)}
        />
      )}
    </div>
  );
}
