"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Language names are written in their own language, so they never change.
const names = { en: "EN", pt: "PT", es: "ES" } as const;

export function LanguageSwitcher({ label }: { label: string }) {
  const current = useLocale();
  const pathname = usePathname();

  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          aria-current={locale === current ? "true" : undefined}
          className={`rounded-full px-2 py-1 text-xs tracking-wide ${
            locale === current
              ? "bg-sage text-paper"
              : "text-muted hover:text-ink"
          }`}
        >
          {names[locale]}
        </Link>
      ))}
    </div>
  );
}
