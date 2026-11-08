import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { localize } from "@/lib/localized";
import { Section } from "../_components/Section";

// Paragraph keys from messages/*.json → "Story". Add a key here to add a paragraph.
const howWeMet = ["p1", "p2", "p3", "p4"] as const;
const proposal = ["p5", "p6"] as const;

// Grid layout: the first photo is big (2×2). If the last row would leave an
// empty cell, the last photo stretches wide to fill it (phones have 2 columns,
// computers 3). Returns the cell's span classes and the photo's shape.
const deskSpan = { 1: "sm:col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-3" } as const;
const deskShape = { 1: "sm:aspect-square", 2: "sm:aspect-[2/1]", 3: "sm:aspect-[3/1]" } as const;

function layout(i: number, count: number) {
  if (i === 0) return { cell: "col-span-2 row-span-2", shape: "aspect-square" };
  if (i !== count - 1) return { cell: "", shape: "aspect-square" };

  const rest = count - 1; // photos after the big one
  const phoneWide = rest % 2 === 1; // phones: rows of 2
  const deskRest = rest - 2; // computers: 2 sit beside the big photo, then rows of 3
  const left = deskRest > 0 ? deskRest % 3 : 0;
  const span = (left === 1 ? 3 : left === 2 ? 2 : 1) as 1 | 2 | 3;

  return {
    cell: `${phoneWide ? "col-span-2" : ""} ${deskSpan[span]}`,
    shape: `${phoneWide ? "aspect-[2/1]" : "aspect-square"} ${deskShape[span]}`,
  };
}

export async function Story() {
  const t = await getTranslations("Story");
  const locale = await getLocale();
  const photos = event.storyPhotos;

  return (
    <Section id="story" title={t("title")}>
      <div className="mx-auto max-w-prose space-y-4 text-center text-lg leading-relaxed text-muted">
        {howWeMet.map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
        <h3 className="pt-6 font-serif text-3xl text-gold">{t("proposalTitle")}</h3>
        {proposal.map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
      </div>

      {photos.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, i) => (
            <div
              key={photo.src}
              className={`glass relative overflow-hidden rounded-3xl p-1.5 ${layout(i, photos.length).cell}`}
            >
              <div className={`relative overflow-hidden rounded-[1.3rem] ${layout(i, photos.length).shape}`}>
                <Image
                  src={photo.src}
                  alt={localize(photo.alt, locale)}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
