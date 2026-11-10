"use client";

import { useEffect, useRef, useState } from "react";

type Stage = "closed" | "open" | "letter" | "done" | "gone";
const INTRO_KEY = "envelope-seen"; // also used in app/[locale]/layout.tsx

/*
  Opening animation on a guest's first visit: a sealed envelope opens,
  the card slides out, then the site appears. Plays once per visit,
  tap anywhere (or "Skip") to jump ahead, and it's skipped entirely for
  guests who ask their phone for reduced motion.

  Personal invites (/i/[slug]) pass `to` ("For Ana") and `tapHint`: the
  envelope then waits, sealed, until the guest taps it.
*/
export function EnvelopeIntro({
  first,
  second,
  kicker,
  skip,
  to,
  tapHint,
}: {
  first: string;
  second: string;
  kicker: string;
  skip: string;
  to?: string;
  tapHint?: string;
}) {
  const [stage, setStage] = useState<Stage>("closed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const waitForTap = Boolean(tapHint);

  const later = (ms: number, next: Stage) => timers.current.push(setTimeout(() => setStage(next), ms));
  const play = (delay: number) => {
    later(delay, "open");
    later(delay + 700, "letter");
    later(delay + 2200, "done");
    later(delay + 3000, "gone");
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    const pending = timers.current;
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- respects a browser setting after load
      setStage("gone");
    } else if (!waitForTap) {
      play(700);
    }
    return () => pending.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on load
  }, []);

  if (stage === "gone") return null;

  const finish = () => {
    timers.current.forEach(clearTimeout);
    setStage("done");
    later(700, "gone");
  };
  const tap = () => (waitForTap && stage === "closed" ? play(0) : finish());

  return (
    <div className="envelope-intro" data-stage={stage} onClick={tap} aria-hidden={stage === "done"}>
      <div className="envelope">
        <div className="envelope-back" />
        <div className="envelope-letter">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-muted">{kicker}</p>
            <p className="mt-2 font-serif text-2xl tracking-[0.12em] uppercase sm:text-3xl">
              {first} <span className="font-script normal-case tracking-normal text-gold">&amp;</span> {second}
            </p>
          </div>
        </div>
        <div className="envelope-front" />
        <div className="envelope-flap" />
        {to && <p className="envelope-to font-script">{to}</p>}
        <div className="envelope-seal">
          <span className="font-script text-2xl sm:text-3xl">
            {first[0]}&amp;{second[0]}
          </span>
        </div>
      </div>
      {waitForTap && (
        <p className="envelope-hint absolute bottom-24 text-sm uppercase tracking-[0.25em] text-gold">{tapHint}</p>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
        className="absolute bottom-8 rounded-full px-5 py-2 text-xs uppercase tracking-[0.25em] text-muted hover:text-ink"
      >
        {skip}
      </button>
    </div>
  );
}
