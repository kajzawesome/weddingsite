"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Countdown } from "../_components/Countdown";

// The gallery's countdown: when it reaches zero, reload the page so the album opens.
export function GalleryCountdown({ to }: { to: string }) {
  const router = useRouter();
  const onEnd = useCallback(() => router.refresh(), [router]);
  return <Countdown to={to} onEnd={onEnd} className="text-primary-dark" />;
}
