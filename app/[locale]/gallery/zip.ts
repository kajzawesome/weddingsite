"use client";

import { zipSync } from "fflate";
import type { GalleryItem } from "@/lib/galleryTypes";

/*
  Builds the "my hearts" zip right in the guest's browser: fetch each original
  file, pack them into one zip (no extra compression; photos and videos are
  already compressed), then hand it over as a download. Our server never
  touches the files.
*/
export async function downloadZip(items: GalleryItem[], name: string, onProgress: (done: number) => void) {
  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();

  for (const [i, item] of items.entries()) {
    const res = await fetch(item.original);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    files[fileName(item, i, used)] = new Uint8Array(await res.arrayBuffer());
    onProgress(i + 1);
  }

  const zip = zipSync(files, { level: 0 });
  const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: "application/zip" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// e.g. "03-ana-silva.jpg"
function fileName(item: GalleryItem, i: number, used: Set<string>) {
  const ext = new URL(item.original, location.href).pathname.split(".").pop()?.toLowerCase() || "jpg";
  const who = (item.by ?? "guest")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  let name = `${String(i + 1).padStart(2, "0")}-${who || "guest"}.${ext}`;
  if (used.has(name)) name = `${i + 1}-${name}`;
  used.add(name);
  return name;
}
