import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { event } from "@/config/event";
import { routing } from "@/i18n/routing";
import { sans, script, serif } from "@/lib/fonts";
import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { LanguageSuggest } from "./_components/LanguageSuggest";

// Must match INTRO_KEY in _home/EnvelopeIntro.tsx (a client file, so not imported here).
const INTRO_KEY = "envelope-seen";
import "../globals.css";

// Pre-build /en, /pt and /es at deploy time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return {
    title: t("title", event.couple),
    description: t("description"),
  };
}

const htmlLang = { en: "en", pt: "pt-BR", es: "es" } as const;

export default async function LocaleLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      lang={htmlLang[locale]}
      className={`${serif.variable} ${sans.variable} ${script.variable} antialiased`}
      // The script below may add a class before React loads; that's expected.
      suppressHydrationWarning
    >
      <head>
        {/* Runs before the page paints: hide the opening envelope if it already played this visit. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("${INTRO_KEY}"))document.documentElement.classList.add("intro-seen")}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <div aria-hidden className="page-glow" />
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <LanguageSuggest />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
