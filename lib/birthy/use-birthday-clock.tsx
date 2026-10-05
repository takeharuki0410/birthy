"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { nextTokyoMidnight } from "./birthday-cards";

const InitialTime = createContext(0);
let snapshot = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
function tick() {
  snapshot = Date.now();
  listeners.forEach((listener) => listener());
  if (timer) clearTimeout(timer);
  if (listeners.size) timer = setTimeout(tick, Math.max(10, Math.min(60_000, nextTokyoMidnight(new Date(snapshot)) - snapshot + 10)));
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("focus",tick);
    document.addEventListener("visibilitychange",tick);
    tick();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus",tick);
      document.removeEventListener("visibilitychange",tick);
    }
  };
}
export function BirthdayClockProvider({ initialNow, children }: { initialNow: string; children: ReactNode }) {
  return <InitialTime.Provider value={Date.parse(initialNow)}>{children}</InitialTime.Provider>;
}
/** One shared timer, exact midnight wakeup and foreground refresh; SSR uses the serialized timestamp. */
export function useBirthdayNow(): Date {
  const initial = useContext(InitialTime);
  const epoch = useSyncExternalStore(subscribe,() => snapshot || initial,() => initial);
  return useMemo(() => new Date(epoch),[epoch]);
}
