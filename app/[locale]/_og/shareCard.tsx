import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { getFormatter, getTranslations } from "next-intl/server";
import { event } from "@/config/event";

/*
  The picture WhatsApp, iMessage and Facebook show when someone pastes a link
  to the site (an "Open Graph" image): our photo on the left, our names on the
  right. Used by app/[locale]/opengraph-image.tsx and by personal invites.
*/

export const size = { width: 1200, height: 630 };

const dataUri = async (file: string, type: string) =>
  `data:${type};base64,${(await readFile(path.join(process.cwd(), "public", file))).toString("base64")}`;

// The image renderer needs the font file itself (.ttf), so we ask Google Fonts
// for just the letters we use. "use cache" keeps each download for next time.
async function serifFont(text: string) {
  "use cache";
  cacheLife("max");
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null; // falls back to the built-in font
  }
}

// Draws the card. `to` adds a line for personal invites ("Para Ana & Pedro").
export async function shareCard(locale: string, to?: string) {
  const [hero, format] = await Promise.all([getTranslations({ locale, namespace: "Hero" }), getFormatter({ locale })]);
  const kicker = hero("kicker");
  const date = event.date ? format.dateTime(new Date(event.date), { dateStyle: "long", timeZone: "UTC" }) : hero("dateSoon");
  const { first, second } = event.couple;

  const [photo, garland, font] = await Promise.all([
    dataUri("photos/hero-sunset.jpg", "image/jpeg"),
    dataUri("email/garland.png", "image/png"),
    serifFont(`${first}&${second}${date}${to ?? ""}`),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#fcf1f2" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- plain img is what ImageResponse renders */}
        <img src={photo} alt="" width={460} height={630} style={{ width: 460, height: 630, objectFit: "cover" }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: 36,
            background: "#ffffff",
            border: "1px solid #ece3dc",
            borderRadius: 32,
            color: "#2b2a33",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img is what ImageResponse renders */}
          <img src={garland} alt="" width={300} height={125} />
          <div style={{ marginTop: 18, fontSize: 20, letterSpacing: 8, textTransform: "uppercase", color: "#b8955a" }}>
            {kicker}
          </div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 92, fontFamily: font ? "Serif" : undefined }}>
            {first}
            <span style={{ margin: "0 22px", fontStyle: "italic", color: "#b8955a" }}>&amp;</span>
            {second}
          </div>
          <div style={{ marginTop: 10, width: 220, height: 2, background: "#b8955a", opacity: 0.6 }} />
          <div style={{ marginTop: 22, fontSize: 36, color: "#6b6570", fontFamily: font ? "Serif" : undefined }}>{date}</div>
          {to && (
            <div style={{ marginTop: 26, fontSize: 40, color: "#2b2a33", fontStyle: "italic", fontFamily: font ? "Serif" : undefined }}>
              {to}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Serif", data: font, weight: 500, style: "normal" }] : undefined },
  );
}
