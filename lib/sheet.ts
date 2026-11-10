import "server-only";
import { cacheLife, cacheTag } from "next/cache";

/*
  Talks to our Google Apps Script (scripts/rsvp-apps-script.gs), which reads and
  writes the Google Sheet. Every request carries RSVP_SECRET; without it the
  script refuses. Only server code can import this file.
*/

export type Guest = {
  slug: string;
  name: string; // what the envelope says: "Ana" or "Ana & Pedro"
  email: string;
  phone: string;
  lang: string;
  emailed: string; // date text from the sheet, "" if never
  whatsapp: string;
  opened: string;
};

export const GUESTS_CACHE_TAG = "guests";

export async function callSheet<T = Record<string, unknown>>(payload: Record<string, unknown>): Promise<T & { ok: boolean; error?: string }> {
  const url = process.env.RSVP_SCRIPT_URL;
  const secret = process.env.RSVP_SECRET;
  if (!url || !secret) throw new Error("RSVP_SCRIPT_URL / RSVP_SECRET missing");

  const res = await fetch(url, {
    method: "POST",
    // Apps Script reads the raw body; text/plain avoids an extra CORS-style preflight.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, ...payload }),
    cache: "no-store",
  });
  const result = (await res.json().catch(() => null)) as (T & { ok: boolean; error?: string }) | null;
  // "unauthorized" = RSVP_SECRET doesn't match SECRET in the script
  if (!res.ok || !result) throw new Error(`Apps Script replied ${res.status}: not JSON`);
  return result;
}

/*
  One guest by their link ID. "use cache" remembers the answer for a few
  minutes, so a guest reloading their invite doesn't wait on Google each time
  (the script takes a second or two). Name changes in the sheet show up
  within about 10 minutes.
*/
export async function getGuest(slug: string): Promise<Pick<Guest, "slug" | "name" | "lang"> | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
  cacheTag(GUESTS_CACHE_TAG);
  try {
    const { guest } = await callSheet<{ guest: Guest | null }>({ action: "guest", slug });
    return guest ? { slug: guest.slug, name: guest.name, lang: guest.lang } : null;
  } catch (err) {
    console.error("Couldn't look up guest", err);
    return null;
  }
}

// The whole list, fresh (admin page only).
export async function listGuests(): Promise<Guest[]> {
  const { ok, guests, error } = await callSheet<{ guests: Guest[] }>({ action: "guests" });
  if (!ok) throw new Error(error);
  return guests;
}
