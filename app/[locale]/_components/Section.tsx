import type { ReactNode } from "react";
import { Eucalyptus } from "./Decor";

// A page section with a centred title framed by two eucalyptus sprigs.
export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-5xl scroll-mt-24 px-4 py-14">
      <div className="reveal mb-8 flex items-center justify-center gap-3 sm:gap-5">
        <Eucalyptus side="left" />
        <h2 className="text-center font-serif text-4xl">{title}</h2>
        <Eucalyptus side="right" />
      </div>
      {children}
    </section>
  );
}
