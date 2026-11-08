import { getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("Nav");
  const { first, second } = event.couple;

  return (
    <header className="sticky top-0 z-20 px-3 pt-3">
      <div className="glass mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full py-2 pr-2 pl-5">
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
          <LanguageSwitcher label={t("language")} />
        </nav>
      </div>
    </header>
  );
}
