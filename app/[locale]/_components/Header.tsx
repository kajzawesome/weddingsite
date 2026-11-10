import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher, LanguageSwitcherShell } from "./LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("Nav");
  const { first, second } = event.couple;

  return (
    // h-0: the bar floats over the page (and the full-screen photo) without taking up space.
    <header className="sticky top-0 z-30 h-0 px-3">
      <div className="glass mx-auto mt-3 flex max-w-5xl items-center justify-between gap-3 rounded-full py-2 pr-2 pl-5">
        <Link href="/" className="shrink-0 font-serif text-lg sm:text-xl">
          {first} <span className="font-script text-gold">&amp;</span> {second}
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link href="/gallery" className="hover:text-primary-dark">
            {t("photos")}
          </Link>
          <Link href="/registry" className="hover:text-primary-dark">
            {t("registry")}
          </Link>
          <Suspense fallback={<LanguageSwitcherShell label={t("language")} />}>
            <LanguageSwitcher label={t("language")} />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
