import { getTranslations } from "next-intl/server";
import { registry } from "@/lib/registry";

const button =
  "flex flex-col items-center rounded-2xl bg-primary px-6 py-3 text-center font-medium text-paper ring-1 ring-gold/40 hover:bg-primary-dark";

// Venmo and PayPal links open the app (or website) straight to our profile.
export async function Give() {
  const t = await getTranslations("Registry.give");
  const { venmo, paypal } = registry.giving;
  const soon = <span className="text-xs text-muted">{t("soon")}</span>;

  return (
    <section id="give" className="mt-16 scroll-mt-24 text-center">
      <h2 className="font-serif text-4xl">{t("title")}</h2>
      <p className="mx-auto mt-3 mb-6 max-w-prose text-muted">{t("intro")}</p>

      <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
        {venmo ? (
          <a href={`https://venmo.com/u/${venmo}`} target="_blank" rel="noopener noreferrer" className={button}>
            Venmo
            <span className="text-xs font-normal opacity-80">@{venmo}</span>
          </a>
        ) : (
          <div className="glass flex flex-col rounded-2xl px-6 py-3 font-medium">Venmo {soon}</div>
        )}

        {paypal ? (
          <a href={`https://paypal.me/${paypal}`} target="_blank" rel="noopener noreferrer" className={button}>
            PayPal
            <span className="text-xs font-normal opacity-80">paypal.me/{paypal}</span>
          </a>
        ) : (
          <div className="glass flex flex-col rounded-2xl px-6 py-3 font-medium">PayPal {soon}</div>
        )}
      </div>

      <div className="glass mx-auto mt-6 max-w-xl rounded-3xl px-6 py-5">
        <h3 className="font-serif text-2xl">{t("boxTitle")}</h3>
        <p className="mt-1 text-muted">{t("boxBody")}</p>
      </div>
    </section>
  );
}
