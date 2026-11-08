import { getTranslations } from "next-intl/server";
import { event } from "@/config/event";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("Nav");
  const { first, second } = event.couple;

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-serif text-xl">
          {first} <span className="text-gold">&</span> {second}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/registry" className="hover:text-sage-dark">
            {t("registry")}
          </Link>
          <LanguageSwitcher label={t("language")} />
        </nav>
      </div>
    </header>
  );
}
