import data from "@/config/registry.json";
import type { Localized } from "@/lib/localized";

export type Store = { id: string; name: Localized; url: string | null };
export type Item = { name: Localized; note?: Localized };
export type Category = { id: string; title: Localized; items: Item[] };
// image: a file in /public, e.g. "/funds/korea.jpg". null shows a plain colour card.
export type Fund = { name: Localized; blurb: Localized; image: string | null };
// Usernames only, e.g. venmo: "KAJ_Jacobs". null shows "Coming soon".
export type Giving = {
  venmo: string | null;
  paypal: string | null;
};

// Typed view of config/registry.json (the file KAJ and Tayna edit).
export const registry = data as {
  stores: Store[];
  categories: Category[];
  cashFunds: Fund[];
  giving: Giving;
};
