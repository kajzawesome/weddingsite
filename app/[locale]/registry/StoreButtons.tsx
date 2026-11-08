import { getLocale, getTranslations } from "next-intl/server";
import { localize } from "@/lib/localized";
import { registry } from "@/lib/registry";

// One button per store. Stores without a link yet show "Link coming soon".
export async function StoreButtons() {
  const t = await getTranslations("Registry");
  const locale = await getLocale();

  return (
    <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
      {registry.stores.map((store) => {
        const name = localize(store.name, locale);
        return store.url ? (
          <a
            key={store.id}
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-6 py-3 text-center font-medium text-paper ring-1 ring-gold/40 hover:bg-primary-dark"
          >
            {name}
          </a>
        ) : (
          <span
            key={store.id}
            className="glass flex flex-col rounded-2xl px-6 py-3 text-center"
          >
            <span className="font-medium">{name}</span>
            <span className="text-xs text-muted">{t("linkSoon")}</span>
          </span>
        );
      })}
    </div>
  );
}
