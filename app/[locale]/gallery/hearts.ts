"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
  Hearts are saved on the guest's own phone (localStorage), not on our server.
  No accounts or database needed; the trade-off is that hearts don't follow a
  guest to another device, which is fine for "pick favourites, download them".
  useSyncExternalStore keeps every heart button in sync, even across tabs.
*/

const KEY = "gallery-hearts";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();

let memory = "[]"; // used if the browser blocks storage (e.g. some private modes)
let lastRaw: string | null = null;
let lastList: string[] = EMPTY;

function read() {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return memory;
  }
}

function snapshot() {
  const raw = read();
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      const parsed: unknown = JSON.parse(raw);
      lastList = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : EMPTY;
    } catch {
      lastList = EMPTY;
    }
  }
  return lastList;
}

function write(list: string[]) {
  const raw = JSON.stringify(list);
  memory = raw;
  try {
    localStorage.setItem(KEY, raw);
  } catch {}
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

export function useHearts() {
  const hearts = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const list = snapshot();
    write(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }, []);
  return { hearts, toggle };
}
