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
  couple: { first: "KAJ", second: "Tayna" },

  // ISO date, e.g. "2027-06-12". null = "Date coming soon".
  date: null as string | null,

  // Planned: sealing at the Provo City Center Temple, then a short ring
  // ceremony right before the reception. All in Provo, Utah.
  sealing: {
    name: "Provo City Center Temple",
    address: "50 S University Ave, Provo, UT 84601",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Provo+City+Center+Temple",
    time: null,
  } as Venue,
  ringCeremony: { name: null, address: null, mapUrl: null, time: null } as Venue,
  reception: { name: null, address: null, mapUrl: null, time: null } as Venue,

  dressCode: {
    en: "Professional or church attire. We're members of The Church of Jesus Christ of Latter-day Saints, so think Sunday best.",
    pt: "Traje social ou roupa de igreja. Somos membros de A Igreja de Jesus Cristo dos Santos dos Últimos Dias, então pense na sua roupa de domingo.",
    es: "Ropa formal o de iglesia. Somos miembros de La Iglesia de Jesucristo de los Santos de los Últimos Días, así que piensa en tu ropa de domingo.",
  } as Localized | null,

  rsvpDeadline: null as string | null, // ISO date

  // Big framed photo under our names. Files go in /public/photos.
  // photo = tall shot for phones; photoWide = wide shot for computers (optional).
  hero: {
    video: null as string | null, // e.g. "/hero.mp4"
    photo: "/photos/hero-sunset.jpg" as string | null,
    photoWide: "/photos/hero-hills.jpg" as string | null,
  },

  // Photos under "Our story" (just the two of us). The first one shows larger;
  // the grid stretches the last photo to fill any gap, so any count works.
  storyPhotos: [
    { src: "/photos/sunset-embrace.jpg", alt: { en: "Our engagement at sunset", pt: "Nosso noivado ao pôr do sol", es: "Nuestro compromiso al atardecer" } },
    { src: "/photos/ring-box.jpg", alt: { en: "The ring box, moments before the proposal", pt: "A caixinha do anel, momentos antes do pedido", es: "La cajita del anillo, momentos antes de la propuesta" } },
    { src: "/photos/hug.jpg", alt: { en: "A hug in the hills", pt: "Um abraço nos morros", es: "Un abrazo en las colinas" } },
    { src: "/photos/ring-selfie.jpg", alt: { en: "A happy selfie right after the yes", pt: "Uma selfie feliz logo depois do sim", es: "Una selfie feliz justo después del sí" } },
    { src: "/photos/hills-together.jpg", alt: { en: "Together in the hills of Bahia", pt: "Juntos nos morros da Bahia", es: "Juntos en las colinas de Bahía" } },
  ] as { src: string; alt: Localized }[],

  // Photo at the top of "At the reception".
  receptionPhoto: {
    src: "/photos/dancing.jpg",
    alt: { en: "KAJ twirling Tayna", pt: "O KAJ girando a Tayna", es: "KAJ haciendo girar a Tayna" },
  } as { src: string; alt: Localized } | null,

  // Optional artwork, e.g. a watercolour rose/sunflower corner (transparent PNG).
  decor: {
    corner: null as string | null, // e.g. "/art/flowers-corner.png"
  },
};
