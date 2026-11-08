"use client";

import { useState } from "react";

// Shows a value (e.g. our Zelle email) and copies it to the clipboard on tap.
export function CopyButton({
  text,
  label,
  copiedLabel,
  className,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  className: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked: the value is still visible to copy by hand.
        }
      }}
    >
      {label}
      <span className="text-xs font-normal opacity-80" aria-live="polite">
        {copied ? copiedLabel : text}
      </span>
    </button>
  );
}
