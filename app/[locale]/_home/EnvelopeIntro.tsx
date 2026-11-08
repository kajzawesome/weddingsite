"use client";

import { useEffect, useState } from "react";

type Stage = "closed" | "open" | "letter" | "done" | "gone";
const INTRO_KEY = "envelope-seen"; // also used in app/[locale]/layout.tsx

/*
  Opening animation on a guest's first visit: a sealed envelope opens,
  the card slides out, then the site appears. Plays once per visit,
  tap anywhere (or "Skip") to jump ahead, and it's skipped entirely for
  guests who ask their phone for reduced motion.
*/
export function EnvelopeIntro({
  first,
  second,
  kicker,
  skip,
}: {
  first: string;
  second: string;
  kicker: string;
  skip: string;
}) {
  const [stage, setStage] = useState<Stage>("closed");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- respects a browser setting after load
      setStage("gone");
      return;
    }
    const timers = [
      setTimeout(() => setStage("open"), 700),
      setTimeout(() => setStage("letter"), 1400),
      setTimeout(() => setStage("done"), 2900),
      setTimeout(() => setStage("gone"), 3700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (stage === "gone") return null;

  const finish = () => {
    setStage("done");
    setTimeout(() => setStage("gone"), 700);
  };

  return (
    <div className="envelope-intro" data-stage={stage} onClick={finish} aria-hidden={stage === "done"}>
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
        <div className="envelope-seal">
          <span className="font-script text-2xl sm:text-3xl">
            {first[0]}&amp;{second[0]}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 rounded-full px-5 py-2 text-xs uppercase tracking-[0.25em] text-muted hover:text-ink"
      >
        {skip}
      </button>
    </div>
  );
}
