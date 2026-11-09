"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const UNITS = ["days", "hours", "minutes", "seconds"] as const;
const DAY = 86_400_000;

// "2027-06-12T10:00:00-06:00" is an exact moment. A plain "2027-06-12" means
// midnight on that day in the guest's own time zone.
function targetTime(to: string) {
  if (to.includes("T")) return new Date(to).getTime();
  const [y, m, d] = to.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function split(ms: number) {
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86_400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 };
}

/*
  Days, hours, minutes and seconds until the wedding. It runs in the guest's
  browser (pages are built ahead of time, so the server can't know "now").
  On the day it says "Today's the day!", and the day after it disappears.
  onEnd runs once when it reaches zero (the gallery uses it to open itself).
*/
export function Countdown({ to, onEnd, className = "" }: { to: string; onEnd?: () => void; className?: string }) {
  const t = useTranslations("Countdown");
  const [now, setNow] = useState<number | null>(null);
  const target = targetTime(to);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const left = now === null ? null : target - now;
  const ended = left !== null && left <= 0;

  useEffect(() => {
    if (ended) onEnd?.();
  }, [ended, onEnd]);

  if (left !== null && left <= -DAY) return null;
  if (ended) return <p className={`font-serif text-2xl ${className}`}>{t("today")}</p>;

  // Before the first tick, show the boxes empty so the layout doesn't jump.
  const parts = left === null ? null : split(left);
  return (
    <div role="timer" aria-label={t("label")} className={`flex justify-center gap-4 sm:gap-6 ${className}`}>
      {UNITS.map((unit) => (
        <div key={unit} className="min-w-12 text-center">
          <p className="font-serif text-3xl tabular-nums sm:text-4xl">
            {parts ? String(parts[unit]).padStart(unit === "days" ? 1 : 2, "0") : " "}
          </p>
          <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.25em] opacity-80">
            {t(unit, { count: parts?.[unit] ?? 0 })}
          </p>
        </div>
      ))}
    </div>
  );
}
