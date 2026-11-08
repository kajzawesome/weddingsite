import { getImageProps } from "next/image";

// "Art direction": phones get the tall photo, wider screens get the wide one.
// <picture> lets the browser download only the one it needs.
export function HeroPhoto({ tall, wide, alt }: { tall: string; wide: string | null; alt: string }) {
  const common = { alt, priority: true, quality: 90, sizes: "100vw" };
  const { props: tallProps } = getImageProps({ ...common, src: tall, width: 1066, height: 1600 });
  const wideSrcSet = wide
    ? getImageProps({ ...common, src: wide, width: 1600, height: 1066 }).props.srcSet
    : undefined;

  return (
    <picture>
      {wideSrcSet && <source media="(min-width: 640px)" srcSet={wideSrcSet} />}
      <img {...tallProps} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    </picture>
  );
}
