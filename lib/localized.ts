import type { Locale } from "@/i18n/routing";

// Text that can be plain English or translated per language.
// Missing translations fall back to English.
export type Localized = string | ({ en: string } & Partial<Record<Locale, string>>);

export function localize(value: Localized, locale: string): string {
  if (typeof value === "string") return value;
  return value[locale as Locale] ?? value.en;
}
