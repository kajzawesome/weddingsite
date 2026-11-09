import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { event } from "@/config/event";
import { cloudinaryConfig, sign, UPLOAD_TAG } from "@/lib/cloudinary";
import type { GalleryItem } from "@/lib/galleryTypes";

export const HIDDEN_TAG = "hidden"; // Cloudinary tag on photos an admin hid
export const GALLERY_CACHE_TAG = "gallery";

// ---------- When is it open? ----------

export function galleryIsOpen() {
  if (event.gallery.demo) return true;
  return event.startsAt != null && Date.now() >= new Date(event.startsAt).getTime();
}

// ---------- Codes and cookies ----------
/*
  A guest types the gallery code once. The server checks it and, if it's right,
  sets an "httpOnly" cookie: a small note the browser sends back on every visit
  but that page scripts can't read or change. The cookie holds a hash of the code
  rather than the code itself, so changing the code locks everyone out again.
*/

type Role = "guest" | "admin";
const COOKIE: Record<Role, string> = { guest: "gallery-guest", admin: "gallery-admin" };

function codeFor(role: Role) {
  // The guest code falls back to the photo upload code, so one table card covers both.
  const code = role === "admin" ? process.env.ADMIN_CODE : process.env.GALLERY_CODE || process.env.SHARE_CODE;
  return code?.trim() || null;
}

function token(role: Role, code: string) {
  return createHash("sha256").update(`${role}:${code.trim().toUpperCase()}`).digest("hex");
}

// Compares in constant time, so the response time doesn't hint at how close a guess was.
function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function codeIsSetUp(role: Role) {
  return codeFor(role) !== null;
}

export function checkCode(role: Role, attempt: string) {
  const code = codeFor(role);
  return code !== null && same(token(role, attempt), token(role, code));
}

export async function grantAccess(role: Role) {
  const code = codeFor(role);
  if (!code) return;
  const store = await cookies();
  store.set(COOKIE[role], token(role, code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 120, // about four months
  });
}

export async function galleryAccess() {
  const store = await cookies();
  const has = (role: Role) => {
    const code = codeFor(role);
    const value = store.get(COOKIE[role])?.value;
    return Boolean(code && value && same(value, token(role, code)));
  };
  const admin = has("admin");
  return { admin, guest: admin || has("guest") };
}

// ---------- The photos ----------

export async function listPhotos(): Promise<GalleryItem[]> {
  return event.gallery.demo ? demoPhotos() : cloudinaryPhotos();
}

// Demo mode: our engagement photos, resized by Next's built-in image optimiser.
// "Hidden" is only remembered until the server restarts, which is fine for testing.
// Kept on globalThis so the page and /api/gallery (bundled separately) share one list.
const demoHidden: Set<string> = ((globalThis as { __demoHidden?: Set<string> }).__demoHidden ??= new Set());

function demoPhotos(): GalleryItem[] {
  const resized = (src: string, width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
  const start = Date.UTC(2026, 0, 1);
  return event.engagementPhotos.map((photo, i) => ({
    id: photo.src,
    kind: "image",
    thumb: resized(photo.src, 640),
    large: resized(photo.src, 1920),
    original: photo.src,
    download: photo.src,
    width: photo.width,
    height: photo.height,
    by: `${event.couple.first} & ${event.couple.second}`,
    at: new Date(start - i * 60_000).toISOString(),
    hidden: demoHidden.has(photo.src),
  }));
}

type SearchResource = {
  public_id: string;
  resource_type: "image" | "video";
  format: string;
  version: number;
  width: number;
  height: number;
  created_at: string;
  secure_url: string;
  tags?: string[];
  context?: Record<string, string> & { custom?: Record<string, string> };
};

/*
  Asks Cloudinary's Search API for everything tagged "wedding", newest first.
  "use cache" keeps the answer for a minute, so 100 guests refreshing the page
  cost one Cloudinary call a minute instead of hundreds (the free plan allows
  500 an hour). Hiding a photo clears this cache straight away (see actions.ts).
*/
async function cloudinaryPhotos(): Promise<GalleryItem[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  cacheTag(GALLERY_CACHE_TAG);

  const config = cloudinaryConfig();
  if (!config) return [];
  const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");

  const items: GalleryItem[] = [];
  let cursor: string | undefined;
  try {
    // 500 per page; 10 pages = 5,000 files, well beyond what ~100 guests will send.
    for (let page = 0; page < 10; page++) {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/search`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          expression: `tags=${UPLOAD_TAG}`,
          sort_by: [{ created_at: "desc" }],
          max_results: 500,
          with_field: ["context", "tags"],
          next_cursor: cursor,
        }),
      });
      if (!res.ok) throw new Error(`Cloudinary search replied ${res.status}`);
      const data = (await res.json()) as { resources: SearchResource[]; next_cursor?: string };
      items.push(...data.resources.map((r) => toItem(config.cloudName, r)));
      cursor = data.next_cursor;
      if (!cursor) break;
    }
  } catch (err) {
    console.error("Couldn't list gallery photos", err);
  }
  return items;
}

// Cloudinary resizes on the fly from the URL: c_limit,w_640 = at most 640px wide,
// q_auto/f_auto = best quality and format for the guest's phone, so_0 = a video's first frame.
function toItem(cloudName: string, r: SearchResource): GalleryItem {
  const base = `https://res.cloudinary.com/${cloudName}/${r.resource_type}/upload`;
  const file = `v${r.version}/${r.public_id}`;
  const isVideo = r.resource_type === "video";
  const still = (size: string) =>
    isVideo ? `${base}/so_0,${size},q_auto/${file}.jpg` : `${base}/${size},q_auto,f_auto/${file}.${r.format}`;

  return {
    id: r.public_id,
    kind: isVideo ? "video" : "image",
    thumb: still("c_limit,w_640"),
    large: still("c_limit,w_1920"),
    video: isVideo ? `${base}/q_auto/${file}.mp4` : undefined,
    original: r.secure_url,
    download: `${base}/fl_attachment/${file}.${r.format}`,
    width: r.width,
    height: r.height,
    by: r.context?.uploader ?? r.context?.custom?.uploader ?? null,
    at: r.created_at,
    hidden: r.tags?.includes(HIDDEN_TAG) ?? false,
  };
}

// ---------- Admin ----------

// Hiding adds a "hidden" tag in Cloudinary; nothing is ever deleted.
export async function setHidden(id: string, kind: GalleryItem["kind"], hidden: boolean) {
  if (event.gallery.demo) {
    if (hidden) demoHidden.add(id);
    else demoHidden.delete(id);
    return true;
  }
  const config = cloudinaryConfig();
  if (!config) return false;

  const params = { command: hidden ? "add" : "remove", public_ids: id, tag: HIDDEN_TAG, timestamp: Math.round(Date.now() / 1000) };
  const body = new URLSearchParams({
    command: params.command,
    tag: params.tag,
    timestamp: String(params.timestamp),
    api_key: config.apiKey,
    signature: sign(params, config.apiSecret),
  });
  body.append("public_ids[]", id);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${kind}/tags`, { method: "POST", body });
  if (!res.ok) console.error("Couldn't change hidden tag", res.status, await res.text().catch(() => ""));
  return res.ok;
}

/*
  "Download everything": signed links that ask Cloudinary to zip every upload.
  Photos and videos come as two separate zips (Cloudinary zips one type at a time).
  The links are signed with our secret and only shown on the admin page.
*/
export function backupLinks() {
  const config = cloudinaryConfig();
  if (event.gallery.demo || !config) return null;

  const link = (kind: "image" | "video") => {
    const params = {
      mode: "download",
      tags: UPLOAD_TAG,
      target_format: "zip",
      target_public_id: `wedding-${kind}s`,
      timestamp: Math.round(Date.now() / 1000),
    };
    const query = new URLSearchParams({
      mode: params.mode,
      "tags[]": params.tags,
      target_format: params.target_format,
      target_public_id: params.target_public_id,
      timestamp: String(params.timestamp),
      api_key: config.apiKey,
      signature: sign(params, config.apiSecret),
    });
    return `https://api.cloudinary.com/v1_1/${config.cloudName}/${kind}/generate_archive?${query}`;
  };
  return { photos: link("image"), videos: link("video") };
}
