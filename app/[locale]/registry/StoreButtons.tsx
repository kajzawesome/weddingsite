import { getLocale, getTranslations } from "next-intl/server";
import { localize } from "@/lib/localized";
import { registry } from "@/lib/registry";

// One button per store. Stores without a link yet show "Link coming soon".
export async function StoreButtons() {
  const t = await getTranslations("Registry");
  const locale = await getLocale();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      {registry.stores.map((store) => {
        const name = localize(store.name, locale);
        return store.url ? (
          <a
            key={store.id}
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-sage px-6 py-3 text-center font-medium text-paper hover:bg-sage-dark"
          >
            {name}
          </a>
        ) : (
          <span
            key={store.id}
            className="rounded-full border border-dashed border-line px-6 py-3 text-center text-muted"
          >
            {name} · {t("linkSoon")}
          </span>
        );
      })}
    </div>
  );
}
