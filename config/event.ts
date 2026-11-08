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

  // Full-screen photo behind our names. Files go in /public/photos.
  // photo = tall shot for phones; photoWide = wide shot for computers (optional).
  hero: {
    video: null as string | null, // e.g. "/hero.mp4"
    photo: "/photos/hero-sunset.jpg" as string | null,
    photoWide: "/photos/hero-hills.jpg" as string | null,
  },

  // Full-screen photos between sections on the home page (exactly two).
  // tall = phones, wide = computers. width/height are the file's pixel size.
  photoBreaks: [
    {
      tall: { src: "/photos/dancing.jpg", width: 1200, height: 1800 },
      // A tall photo shown wide: "position" picks which part stays in view (x% y%).
      wide: { src: "/photos/dancing-large.jpg", width: 2400, height: 3600, position: "50% 42%" },
      alt: { en: "Dancing and celebrating after the yes", pt: "Dançando e comemorando depois do sim", es: "Bailando y celebrando después del sí" },
      caption: undefined,
    },
    {
      tall: { src: "/photos/sunset-embrace.jpg", width: 1200, height: 1600 },
      wide: { src: "/photos/hills-together.jpg", width: 1600, height: 1066 },
      alt: { en: "Our engagement in the hills of Bahia", pt: "Nosso noivado nos morros da Bahia", es: "Nuestro compromiso en las colinas de Bahía" },
      caption: undefined,
    },
  ] as {
    tall: { src: string; width: number; height: number };
    wide: { src: string; width: number; height: number; position?: string };
    alt: Localized;
    caption?: Localized;
  }[],

  // Our engagement photos, shown on the Photos page before the wedding.
  engagementPhotos: [
    { src: "/photos/hero-hills.jpg", width: 1600, height: 1066, alt: { en: "Together in the hills", pt: "Juntos nos morros", es: "Juntos en las colinas" } },
    { src: "/photos/ring-box.jpg", width: 1200, height: 1600, alt: { en: "The ring box, moments before the proposal", pt: "A caixinha do anel, momentos antes do pedido", es: "La cajita del anillo, momentos antes de la propuesta" } },
    { src: "/photos/sunset-embrace.jpg", width: 1200, height: 1600, alt: { en: "At sunset", pt: "Ao pôr do sol", es: "Al atardecer" } },
    { src: "/photos/ring-selfie.jpg", width: 1800, height: 1350, alt: { en: "A happy selfie right after the yes", pt: "Uma selfie feliz logo depois do sim", es: "Una selfie feliz justo después del sí" } },
    { src: "/photos/dancing.jpg", width: 1200, height: 1800, alt: { en: "A twirl in the hills", pt: "Um giro nos morros", es: "Un giro en las colinas" } },
    { src: "/photos/hug.jpg", width: 1200, height: 1800, alt: { en: "A hug in the hills", pt: "Um abraço nos morros", es: "Un abrazo en las colinas" } },
    { src: "/photos/hero-sunset.jpg", width: 1066, height: 1600, alt: { en: "Forehead to forehead at sunset", pt: "Testa com testa ao pôr do sol", es: "Frente con frente al atardecer" } },
    { src: "/photos/hills-together.jpg", width: 1600, height: 1066, alt: { en: "Smiling in the hills of Bahia", pt: "Sorrindo nos morros da Bahia", es: "Sonriendo en las colinas de Bahía" } },
    { src: "/photos/showing-the-ring.jpg", width: 1200, height: 1800, alt: { en: "Showing off the ring", pt: "Mostrando o anel", es: "Mostrando el anillo" } },
    { src: "/photos/family-selfie.jpg", width: 1800, height: 1200, alt: { en: "Celebrating with family", pt: "Comemorando com a família", es: "Celebrando con la familia" } },
    { src: "/photos/family-group.jpg", width: 1800, height: 1200, alt: { en: "With Tayna's family in the hills", pt: "Com a família da Tayna nos morros", es: "Con la familia de Tayna en las colinas" } },
    { src: "/photos/family-circle.jpg", width: 1200, height: 1800, alt: { en: "Everyone gathered around", pt: "Todo mundo reunido", es: "Todos reunidos" } },
    { src: "/photos/family-rings.jpg", width: 1800, height: 1200, alt: { en: "Everyone admiring the ring", pt: "Todo mundo admirando o anel", es: "Todos admirando el anillo" } },
    { src: "/photos/group-selfie.jpg", width: 1800, height: 1200, alt: { en: "A big group selfie", pt: "Uma selfie com todo mundo", es: "Una selfie con todos" } },
  ] as { src: string; width: number; height: number; alt: Localized }[],
};
