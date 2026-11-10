"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Language names are written in their own language, so they never change.
const names = { en: "EN", pt: "PT", es: "ES" } as const;

const pill = (active: boolean) =>
  `rounded-full px-1.5 py-1 text-xs sm:px-2 tracking-wide ${active ? "bg-primary text-paper" : "text-muted hover:text-ink"}`;

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
          className={pill(locale === current)}
        >
          {names[locale]}
        </Link>
      ))}
    </div>
  );
}

// Same look, shown for a split second on pages whose address is only known
// once a guest opens them (personal invites), until the real switcher loads.
export function LanguageSwitcherShell({ label }: { label: string }) {
  const current = useLocale();
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {routing.locales.map((locale) => (
        <span key={locale} className={pill(locale === current)}>
          {names[locale]}
        </span>
      ))}
    </div>
  );
}
