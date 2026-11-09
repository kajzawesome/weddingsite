// Small line icons for the gallery, drawn as SVG so they match the text colour.

type Props = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HeartIcon({ filled, className = "size-5" }: Props & { filled?: boolean }) {
  return (
    <svg {...base} className={className} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" />
    </svg>
  );
}

export function PlayIcon({ className = "size-5" }: Props) {
  return (
    <svg {...base} className={className} fill="currentColor">
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  );
}

export function CloseIcon({ className = "size-6" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronIcon({ dir, className = "size-7" }: Props & { dir: "left" | "right" }) {
  return (
    <svg {...base} className={className}>
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

export function DownloadIcon({ className = "size-5" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
    </svg>
  );
}

export function EyeIcon({ off, className = "size-4" }: Props & { off?: boolean }) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}
