"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slide = { name: string; blurb: string; image: string | null; dotLabel: string };

const SECONDS_PER_SLIDE = 5;

// One fund at a time, fading to the next every few seconds.
// Pauses while a guest hovers, focuses or touches it, and doesn't auto-rotate
// for guests who ask their phone for reduced motion. Swipe or tap the dots to move.
export function FundCarousel({
  slides,
  giveHref,
  label,
  contribute,
}: {
  slides: Slide[];
  giveHref: string;
  label: string;
  contribute: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = (i: number) => setIndex((i + slides.length) % slides.length);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Restarts whenever the slide changes, so a tap on a dot gets a full 5 seconds.
    const timer = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SECONDS_PER_SLIDE * 1000);
    return () => clearTimeout(timer);
  }, [index, paused, slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const dx = start === null ? 0 : e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchStartX.current = null;
        setPaused(false);
      }}
    >
      {/* All slides sit in the same grid cell, so the card keeps the tallest slide's height. */}
      <div className="glass grid overflow-hidden rounded-[2rem]">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.name}
              aria-hidden={!active}
              inert={!active}
              className={`col-start-1 row-start-1 grid transition-opacity duration-700 sm:grid-cols-2 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/80 via-rose/60 to-gold/50 sm:aspect-auto sm:min-h-72">
                {slide.image && (
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 384px, 100vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                )}
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <h3 className="font-serif text-3xl">{slide.name}</h3>
                <p className="mt-2 leading-relaxed text-muted">{slide.blurb}</p>
                {/* Jumps down to "Ways to give" on the same page */}
                <a
                  href={giveHref}
                  className="mt-6 self-start rounded-full bg-primary px-7 py-2.5 font-medium text-paper ring-1 ring-gold/40 hover:bg-primary-dark"
                >
                  {contribute}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.name}
            type="button"
            aria-label={slide.dotLabel}
            aria-current={i === index ? "true" : undefined}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-8 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
