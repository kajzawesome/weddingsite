"use server";

import { refresh, updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { checkCode, codeIsSetUp, GALLERY_CACHE_TAG, galleryAccess, grantAccess, setHidden } from "@/lib/gallery";
import { clientIp, rateLimiter } from "@/lib/rateLimit";

export type UnlockState = { error?: "wrong" | "slow" | "off" };

// 10 tries a minute per IP: plenty for typos, far too slow to guess a code.
const tooMany = rateLimiter(10);

async function unlock(role: "guest" | "admin", formData: FormData): Promise<UnlockState> {
  if (!codeIsSetUp(role)) return { error: "off" };
  if (tooMany(clientIp(await headers()))) return { error: "slow" };
  if (!checkCode(role, String(formData.get("code") ?? ""))) return { error: "wrong" };

  await grantAccess(role);
  refresh(); // re-render the page so it shows what the code unlocked
  return {};
}

export async function unlockGallery(_prev: UnlockState, formData: FormData) {
  return unlock("guest", formData);
}

export async function unlockAdmin(_prev: UnlockState, formData: FormData) {
  return unlock("admin", formData);
}

const hideInput = z.object({ id: z.string().min(1).max(300), kind: z.enum(["image", "video"]), hidden: z.boolean() });

// Admin only: hide (or bring back) one photo for everyone.
export async function setPhotoHidden(input: z.input<typeof hideInput>) {
  const { admin } = await galleryAccess();
  const parsed = hideInput.safeParse(input);
  if (!admin || !parsed.success) return { ok: false };

  const ok = await setHidden(parsed.data.id, parsed.data.kind, parsed.data.hidden);
  if (ok) updateTag(GALLERY_CACHE_TAG); // next load gets the fresh list, not the cached one
  return { ok };
}
