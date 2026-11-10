"use server";

import { headers } from "next/headers";
import { galleryAccess } from "@/lib/gallery";
import { clientIp, rateLimiter } from "@/lib/rateLimit";
import { callSheet } from "@/lib/sheet";

const tooMany = rateLimiter(20);

// Writes the "Opened" date in the Guests tab (only the first time).
export async function markOpened(slug: string) {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return;
  if (tooMany(clientIp(await headers()))) return;
  // You testing a guest's link from a signed-in admin phone doesn't count.
  if ((await galleryAccess()).admin) return;
  try {
    await callSheet({ action: "opened", slug });
  } catch (err) {
    console.error("Couldn't record invite open", err);
  }
}
