import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Small copies of our art and photo, made for email (in public/email).
const FILES = { garland: "garland.png", couple: "couple.jpg", roses: "roses.png" };
export type EmailImage = keyof typeof FILES;

/*
  Email apps can't load pictures from localhost. Once SITE_URL is the live
  https address, the email links to the pictures on the site. Before that,
  they travel inside the email as attachments, which the HTML points to with
  "cid:name" (the Apps Script attaches them).
*/
export async function emailImages() {
  const site = process.env.SITE_URL?.replace(/\/$/, "");
  if (site?.startsWith("https://")) {
    return { src: (name: EmailImage) => `${site}/email/${FILES[name]}`, attachments: undefined };
  }
  try {
    const entries = await Promise.all(
      Object.entries(FILES).map(async ([name, file]) => {
        const data = await readFile(path.join(process.cwd(), "public", "email", file));
        return [name, { data: data.toString("base64"), type: file.endsWith(".png") ? "image/png" : "image/jpeg" }];
      }),
    );
    return {
      src: (name: EmailImage) => `cid:${name}`,
      attachments: Object.fromEntries(entries) as Record<string, { data: string; type: string }>,
    };
  } catch {
    return { src: () => undefined, attachments: undefined }; // no pictures is better than no email
  }
}
