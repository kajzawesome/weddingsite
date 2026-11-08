import Image from "next/image";

type Photo = { src: string; width: number; height: number; alt: string };

// Photos gliding sideways in a continuous loop (like a film strip), done in CSS.
// Each row holds the photos twice, so when the first copy slides out of view the
// second is in exactly the same place and the loop has no visible jump.
// Hover or touch pauses it; with "reduce motion" it becomes a swipeable row.
function Row({ photos, reverse }: { photos: Photo[]; reverse?: boolean }) {
  return (
    <div className="marquee overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`marquee-track flex w-max ${reverse ? "marquee-reverse" : ""}`}
        style={{ animationDuration: `${photos.length * 7}s` }}
      >
        {[0, 1].map((copy) =>
          photos.map((photo) => (
            <div key={`${copy}-${photo.src}`} className="shrink-0 pr-4" aria-hidden={copy === 1}>
              <Image
                src={photo.src}
                alt={copy === 0 ? photo.alt : ""}
                width={photo.width}
                height={photo.height}
                sizes="(min-width: 640px) 480px, 300px"
                className="h-56 w-auto rounded-2xl object-cover shadow-lg shadow-ink/10 sm:h-80"
              />
            </div>
          )),
        )}
      </div>
    </div>
  );
}

export function PhotoMarquee({ photos }: { photos: Photo[] }) {
  // Alternate photos between the two rows so neither row repeats the other.
  const top = photos.filter((_, i) => i % 2 === 0);
  const bottom = photos.filter((_, i) => i % 2 === 1);
  return (
    <div className="reveal space-y-4">
      <Row photos={top} />
      <Row photos={bottom} reverse />
    </div>
  );
}
