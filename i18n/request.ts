import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

// Runs on the server for each request: picks the locale from the URL
// (/en, /pt, /es) and loads that language's messages file.
export default getRequestConfig(async () => {
  const param = await rootLocale();
  const locale = hasLocale(routing.locales, param)
    ? param
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
