"use client";

import type { CSSProperties } from "react";
import { useId } from "react";

type MotionStyle = CSSProperties & Record<`--${string}`, string | number>;

/** A finite, decorative burst: no particles, timers, or animation loop. */
export function Confetti({ kind = "wall" }: { kind?: "wall" | "complete" }) {
  return <div className={`birthy-confetti birthy-confetti-${kind}`} aria-hidden="true">
    {Array.from({ length: kind === "complete" ? 10 : 8 }, (_, index) => <i key={index} style={{
      "--piece-x": `${10 + (index * 29) % 81}%`,
      "--piece-drift": `${index % 2 ? 11 : -11}px`,
      "--piece-turn": `${index % 2 ? 110 : -110}deg`,
      "--piece-delay": `${(index % 3) * 35}ms`,
    } as MotionStyle} />)}
  </div>;
}

/** Larger sends get a slightly fuller flourish, never one element per balloon. */
export function BalloonFlight({ count }: { count: number }) {
  if (count <= 0) return null;
  const visibleCount = Math.min(6, Math.max(1, Math.ceil(Math.log2(count + 1))));
  return <div className="birthy-balloon-flight" aria-hidden="true">
    {Array.from({ length: visibleCount }, (_, index) => <span key={index} style={{
      "--flight-x": `${17 + (index * 17) % 68}%`,
      "--flight-drift": `${index % 2 ? 18 : -18}px`,
      "--flight-delay": `${index * 35}ms`,
      "--flight-size": `${30 + (index % 3) * 4}px`,
    } as MotionStyle}><i /></span>)}
  </div>;
}

/** Shared tab indicator; keyboard arrows and Home/End follow the WAI-ARIA pattern. */
export function MotionTabs({ labels, activeIndex, onChange, ariaLabel }: {
  labels: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  ariaLabel: string;
}) {
  const id = useId();
  return <div className="birthy-motion-tabs" role="tablist" aria-label={ariaLabel}
    style={{ "--tab-count": labels.length, "--active-tab": activeIndex } as MotionStyle}>
    <span className="birthy-tab-indicator" aria-hidden="true" />
    {labels.map((label, index) => <button key={label} type="button" role="tab"
      id={`${id}-tab-${index}`} aria-selected={activeIndex === index}
      tabIndex={activeIndex === index ? 0 : -1} onClick={() => onChange(index)}
      onKeyDown={(event) => {
        const target = event.key === "ArrowRight" ? (index + 1) % labels.length
          : event.key === "ArrowLeft" ? (index + labels.length - 1) % labels.length
          : event.key === "Home" ? 0 : event.key === "End" ? labels.length - 1 : null;
        if (target === null) return;
        event.preventDefault();
        onChange(target);
        (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[target])?.focus();
      }}>{label}</button>)}
  </div>;
}
