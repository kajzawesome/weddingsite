// Simple gold divider. To use real artwork later (e.g. a rose or sunflower
// illustration), put the file in /public and render it between the two lines.
export function Flourish({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="h-px w-12 bg-gold/70" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
      <span className="h-px w-12 bg-gold/70" />
    </div>
  );
}
