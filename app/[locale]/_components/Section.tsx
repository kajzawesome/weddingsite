import type { ReactNode } from "react";

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
    <section id={id} className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14">
      <h2 className="mb-6 text-center font-serif text-4xl">{title}</h2>
      {children}
    </section>
  );
}
