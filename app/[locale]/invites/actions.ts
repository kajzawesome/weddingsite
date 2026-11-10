"use server";

import { galleryAccess } from "@/lib/gallery";
import { callSheet, listGuests } from "@/lib/sheet";
import { inviteEmail } from "./inviteLinks";

/*
  Admin only (same ADMIN_CODE cookie as the photo album admin). The email is
  built here in the guest's language, then the Apps Script sends it from
  KAJ's Gmail and writes the date in the "Emailed" column.
*/
export async function sendInvite(slug: string): Promise<{ ok: boolean }> {
  if (!(await galleryAccess()).admin) return { ok: false };
  try {
    const guest = (await listGuests()).find((g) => g.slug === slug);
    if (!guest?.email) return { ok: false };
    const result = await callSheet({ action: "sendInvite", slug, ...(await inviteEmail(guest)) });
    if (!result.ok) console.error("Invite email failed:", result.error);
    return { ok: result.ok };
  } catch (err) {
    console.error("Invite email failed", err);
    return { ok: false };
  }
}

// Notes the date the WhatsApp message was opened for sending.
export async function markWhatsapp(slug: string): Promise<{ ok: boolean }> {
  if (!(await galleryAccess()).admin) return { ok: false };
  try {
    return { ok: (await callSheet({ action: "whatsapp", slug })).ok };
  } catch {
    return { ok: false };
  }
}
