import type { CSSProperties } from "react";
import { getImageProps } from "next/image";

type Source = { src: string; width: number; height: number; position?: string };

// A full-width photo between sections. Like the hero it stays pinned while the
// next sheet slides over it, which gives the page a calm pause between the text.
// tall = photo for phones, wide = photo for computers.
export function PhotoBreak({
  tall,
  wide,
  alt,
  caption,
}: {
  tall: Source;
  wide: Source;
  alt: string;
  caption?: string;
}) {
  const common = { alt, quality: 90, sizes: "100vw" };
  const { props: tallProps } = getImageProps({ ...common, src: tall.src, width: tall.width, height: tall.height });
  const wideSrcSet = getImageProps({ ...common, src: wide.src, width: wide.width, height: wide.height }).props.srcSet;

  return (
    // On computers the height follows the screen width (3:2), so the photo is
    // cropped as little as possible instead of zooming in to fill a tall screen.
    <div className="sticky top-0 h-[90svh] overflow-hidden sm:h-[min(100svh,66vw)]">
      <picture>
        <source media="(min-width: 640px)" srcSet={wideSrcSet} />
        <img
          {...tallProps}
          alt={alt}
          style={{ "--wide-pos": wide.position ?? "50% 50%" } as CSSProperties}
          className="absolute inset-0 h-full w-full object-cover sm:[object-position:var(--wide-pos)]"
        />
      </picture>
      {caption && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
          <p className="absolute inset-x-0 bottom-20 px-4 text-center font-serif text-2xl text-paper [text-shadow:0_2px_16px_rgb(0_0_0/0.4)] sm:text-3xl">
            {caption}
          </p>
        </>
      )}
    </div>
  );
}
