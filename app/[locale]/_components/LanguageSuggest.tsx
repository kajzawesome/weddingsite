"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";

// Each prompt is shown in the language it suggests, so we need all three here.
const prompts = { en: en.LanguageSuggest, pt: pt.LanguageSuggest, es: es.LanguageSuggest };
const DISMISSED = "language-suggest-dismissed";

/*
  If someone opens a link in one language (e.g. an English link shared on WhatsApp)
  but their phone is set to another language we support, gently offer to switch.
  We use the phone's language setting rather than location: a Brazilian relative
  living in Utah still reads Portuguese best.
*/
export function LanguageSuggest() {
  const current = useLocale();
  const pathname = usePathname();
  const [suggest, setSuggest] = useState<Locale | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED)) return;
    } catch {
      // Storage blocked (private mode): still fine to suggest.
    }
    // First supported language in the phone's preference list, e.g. "pt-BR" -> "pt".
    const preferred = navigator.languages
      .map((tag) => tag.toLowerCase().split("-")[0])
      .find((code): code is Locale => (routing.locales as readonly string[]).includes(code));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the browser's settings after load
    if (preferred && preferred !== current) setSuggest(preferred);
  }, [current]);

  if (!suggest) return null;
  const text = prompts[suggest];

  const dismiss = () => {
    setSuggest(null);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
  };

  return (
    <div
      lang={suggest}
      role="dialog"
      aria-label={text.text}
      className="glass fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl px-5 py-4 text-center text-sm sm:flex-row sm:text-left"
    >
      <p className="flex-1">{text.text}</p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={dismiss} className="rounded-full px-3 py-2 text-muted hover:text-ink">
          {text.dismiss}
        </button>
        <Link
          href={pathname}
          locale={suggest}
          onClick={dismiss}
          className="rounded-full bg-primary px-4 py-2 font-medium text-paper hover:bg-primary-dark"
        >
          {text.switch}
        </Link>
      </div>
    </div>
  );
}
