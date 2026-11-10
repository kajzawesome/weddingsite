"use client";

import { useEffect } from "react";
import { markOpened } from "./actions";

// Tells the sheet this guest opened their invite. It runs in the browser, so
// WhatsApp's link-preview robot (which doesn't run scripts) never counts as an open.
export function MarkOpened({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `opened-${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    markOpened(slug).catch(() => {});
  }, [slug]);
  return null;
}
