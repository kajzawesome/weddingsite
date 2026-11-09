"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { GalleryItem } from "@/lib/galleryTypes";
import { ChevronIcon, CloseIcon, DownloadIcon, HeartIcon } from "./Icons";

const roundButton = "grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20";

// Full-screen view of one photo or video. Swipe or use the arrows to move,
// Escape or the X to close.
export function Lightbox({
  items,
  index,
  onIndex,
  hearted,
  onHeart,
}: {
  items: GalleryItem[];
  index: number;
  onIndex: (index: number | null) => void;
  hearted: boolean;
  onHeart: () => void;
}) {
  const t = useTranslations("Gallery");
  const item = items[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = (step: number) => {
    const next = index + step;
    if (next >= 0 && next < items.length) onIndex(next);
  };

  // Keyboard controls and no page scrolling behind the viewer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      if (e.key === "ArrowRight" && index < items.length - 1) onIndex(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
    };
  }, [index, items.length, onIndex]);

  useEffect(() => closeRef.current?.focus(), []);

  // Load the photos either side in the background, so swiping feels instant.
  useEffect(() => {
    for (const near of [items[index - 1], items[index + 1]]) {
      if (near) new Image().src = near.large;
    }
  }, [index, items]);

  if (!item) return null;
  const caption = item.by ? t(item.kind === "video" ? "videoBy" : "photoBy", { name: item.by }) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? t("title")}
      className="fixed inset-0 z-[100] flex flex-col bg-ink text-white"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onIndex(null); // swipe down closes
      }}
    >
      <div className="flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="pl-2 text-sm text-white/70 tabular-nums">
          {t("counter", { index: index + 1, total: items.length })}
        </p>
        <button ref={closeRef} type="button" onClick={() => onIndex(null)} className={roundButton} aria-label={t("close")}>
          <CloseIcon />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 py-3">
        {item.kind === "video" && item.video ? (
          <video
            key={item.id}
            src={item.video}
            poster={item.large}
            controls
            playsInline
            autoPlay
            className="max-h-full max-w-full rounded-lg"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- already resized by Cloudinary / the image optimiser
          <img
            key={item.id}
            src={item.large}
            alt={caption ?? ""}
            width={item.width}
            height={item.height}
            className="max-h-full w-auto max-w-full rounded-lg object-contain"
          />
        )}

        {/* Arrows for bigger screens; on phones, swipe */}
        {index > 0 && (
          <button type="button" onClick={() => go(-1)} className={`${roundButton} absolute left-3 hidden sm:grid`} aria-label={t("previous")}>
            <ChevronIcon dir="left" />
          </button>
        )}
        {index < items.length - 1 && (
          <button type="button" onClick={() => go(1)} className={`${roundButton} absolute right-3 hidden sm:grid`} aria-label={t("next")}>
            <ChevronIcon dir="right" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="min-w-0 truncate font-serif text-lg">{caption}</p>
        <div className="flex shrink-0 gap-2">
          <a href={item.download} download className={roundButton} aria-label={t("download")}>
            <DownloadIcon />
          </a>
          <button
            type="button"
            onClick={onHeart}
            aria-pressed={hearted}
            aria-label={hearted ? t("unheart") : t("heart")}
            className={`${roundButton} ${hearted ? "text-rose" : ""}`}
          >
            <HeartIcon filled={hearted} className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
