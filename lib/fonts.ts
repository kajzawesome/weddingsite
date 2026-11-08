import { Cormorant_Garamond, Inter, Pinyon_Script } from "next/font/google";

export const serif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

export const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

// Calligraphy accent, used sparingly (the "&" between our names).
export const script = Pinyon_Script({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-pinyon",
});
