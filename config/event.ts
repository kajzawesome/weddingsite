import type { Localized } from "@/lib/localized";

// Every wedding detail lives here. Leave a value as null until it's decided;
// the site shows "coming soon" text instead.

export type Venue = {
  name: string | null;
  address: string | null;
  mapUrl: string | null;
  time: string | null; // e.g. "16:00"
};

export const event = {
  couple: { first: "KAJ", second: "Tay" },

  // ISO date, e.g. "2027-06-12". null = "Date coming soon".
  date: null as string | null,

  ceremony: { name: null, address: null, mapUrl: null, time: null } as Venue,
  reception: { name: null, address: null, mapUrl: null, time: null } as Venue,

  dressCode: null as Localized | null, // e.g. { en: "Garden formal", pt: "Esporte fino", es: "Formal de jardín" }

  rsvpDeadline: null as string | null, // ISO date

  hero: {
    video: null as string | null, // e.g. "/hero.mp4" in /public
    photo: null as string | null, // e.g. "/hero.jpg"; also the video's poster
  },
};
