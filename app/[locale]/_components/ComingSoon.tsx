import { Link } from "@/i18n/navigation";
import { Flourish } from "./Flourish";

// Simple placeholder page for features that open later.
export function ComingSoon({
  title,
  body,
  linkHref,
  linkLabel,
}: {
  title: string;
  body: string;
  linkHref: "/gallery" | "/share";
  linkLabel: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-5xl">{title}</h1>
      <Flourish className="my-6" />
      <p className="leading-relaxed text-muted">{body}</p>
      <Link
        href={linkHref}
        className="mt-8 inline-block text-primary-dark underline underline-offset-4"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
