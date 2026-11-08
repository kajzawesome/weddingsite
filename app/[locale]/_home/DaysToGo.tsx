"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// "123 days to go". Worked out in the guest's browser so it's always today's count,
// even though the page itself is built ahead of time.
export function DaysToGo({ date }: { date: string }) {
  const t = useTranslations("Hero");
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const [y, m, d] = date.split("-").map(Number);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- needs the guest's clock, so it runs after load
    setDays(Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000));
  }, [date]);

  if (days === null || days < 0) return null;
  return (
    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-gold">
      {days === 0 ? t("today") : t("daysToGo", { count: days })}
    </p>
  );
}
