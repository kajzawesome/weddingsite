import Image from "next/image";

// Watercolour artwork used around the site (files in /public/art, credits there).

// Blush rose garland, centred, e.g. above a page title or at the top of a sheet.
export function Garland({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/art/garland.png"
      alt=""
      width={640}
      height={267}
      className={`pointer-events-none mx-auto w-64 select-none sm:w-80 ${className}`}
    />
  );
}

// A pair of eucalyptus sprigs, used either side of a section title.
export function Eucalyptus({ side }: { side: "left" | "right" }) {
  return (
    <Image
      src="/art/eucalyptus.png"
      alt=""
      width={273}
      height={498}
      className={`pointer-events-none h-14 w-auto shrink-0 select-none opacity-80 sm:h-16 ${
        side === "left" ? "-rotate-[35deg]" : "-scale-x-100 rotate-[35deg]"
      }`}
    />
  );
}

// Wildflower meadow along the bottom of the page, repeating across any width.
export function Meadow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none h-24 bg-[url('/art/meadow.png')] bg-[length:auto_100%] bg-bottom bg-repeat-x opacity-90 sm:h-32"
    />
  );
}
