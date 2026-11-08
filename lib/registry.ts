import data from "@/config/registry.json";
import type { Localized } from "@/lib/localized";

export type Store = { id: string; name: Localized; url: string | null };
export type Item = { name: Localized; note?: Localized };
export type Category = { id: string; title: Localized; items: Item[] };
export type Fund = { name: Localized; note?: Localized };

// Typed view of config/registry.json (the file KAJ and Tay edit).
export const registry = data as {
  stores: Store[];
  categories: Category[];
  cashFunds: Fund[];
};
