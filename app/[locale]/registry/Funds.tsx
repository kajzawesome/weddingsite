import { getLocale, getTranslations } from "next-intl/server";
import { localize } from "@/lib/localized";
import { registry } from "@/lib/registry";
import { FundCarousel } from "./FundCarousel";

// Server side: translate the funds, then hand plain text to the carousel.
export async function Funds() {
  const t = await getTranslations("Registry");
  const locale = await getLocale();

  const slides = registry.cashFunds.map((fund) => {
    const name = localize(fund.name, locale);
    return {
      name,
      blurb: localize(fund.blurb, locale),
      image: fund.image,
      dotLabel: t("show", { name }),
    };
  });

  return (
    <FundCarousel
      slides={slides}
      giveHref="#give"
      label={t("fundsTitle")}
      contribute={t("contribute")}
    />
  );
}
