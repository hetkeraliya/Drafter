"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { makeBackdrop, type Ink } from "./backdrop";
import { thoughtPool } from "./thoughts";
import type { DailyThought } from "./types";

export interface ThoughtCard extends DailyThought {
  id: string;
  gradient: string;
  ink: Ink;
  hue: number;
}

const SEEN_KEY = "draftr.thought.seen.v2";
const SEEN_MAX = 300;
const DECK = 3;

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function cardId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// A deck that never shows the same thought twice in a row (or again until the pool is used up),
// mixes live quotes with curated ones, and gives every card its own freshly generated backdrop.
export function useThoughtDeck() {
  const [cards, setCards] = useState<ThoughtCard[]>([]);
  const [shown, setShown] = useState(0);
  const cardsRef = useRef<ThoughtCard[]>([]);
  const seen = useRef<string[]>([]);
  const remote = useRef<DailyThought[]>([]);
  const bag = useRef<DailyThought[]>([]);
  const lastHue = useRef<number | undefined>(undefined);
  const inflight = useRef(false);
  const retryAt = useRef(0);

  const remember = useCallback((headline: string) => {
    seen.current = [headline, ...seen.current.filter((h) => h !== headline)].slice(0, SEEN_MAX);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen.current));
    } catch {
      /* storage full or blocked */
    }
  }, []);

  const refill = useCallback(async () => {
    if (inflight.current || Date.now() < retryAt.current) return;
    inflight.current = true;
    try {
      const res = await fetch("/api/thought?count=20", { cache: "no-store" });
      if (!res.ok) throw new Error("quotes unavailable");
      const data = (await res.json()) as { items?: DailyThought[] };
      const queued = new Set(remote.current.map((t) => t.headline));
      for (const item of data.items || []) {
        if (seen.current.includes(item.headline) || queued.has(item.headline)) continue;
        queued.add(item.headline);
        remote.current.push(item);
      }
      if (!(data.items || []).length) retryAt.current = Date.now() + 20000;
    } catch {
      retryAt.current = Date.now() + 30000;
    } finally {
      inflight.current = false;
    }
  }, []);

  const draw = useCallback((): ThoughtCard => {
    const onTable = new Set(cardsRef.current.map((c) => c.headline));
    const taken = (h: string) => onTable.has(h) || seen.current.includes(h);

    let pick: DailyThought | undefined;
    while (remote.current.length && !pick) {
      const next = remote.current.shift()!;
      if (!taken(next.headline)) pick = next;
    }

    if (!pick) {
      if (!bag.current.length) bag.current = shuffle(thoughtPool());
      let i = bag.current.findIndex((t) => !taken(t.headline));
      if (i === -1) {
        // Everything curated has been seen: start a new round, keeping only what is on screen.
        seen.current = Array.from(onTable);
        bag.current = shuffle(thoughtPool());
        i = bag.current.findIndex((t) => !onTable.has(t.headline));
        if (i === -1) i = 0;
      }
      pick = bag.current.splice(i, 1)[0];
    }

    remember(pick.headline);
    const look = makeBackdrop(lastHue.current);
    lastHue.current = look.hue;
    return { ...pick, id: cardId(), gradient: look.gradient, ink: look.ink, hue: look.hue };
  }, [remember]);

  useEffect(() => {
    if (cardsRef.current.length) return; // StrictMode runs effects twice in dev
    seen.current = readSeen();
    const first: ThoughtCard[] = [];
    cardsRef.current = first;
    for (let i = 0; i < DECK; i++) {
      const next = draw();
      first.push(next);
      cardsRef.current = [...first];
    }
    setCards([...first]);
    void refill();
  }, [draw, refill]);

  const advance = useCallback(() => {
    const current = cardsRef.current;
    if (!current.length) return;
    const rest = current.slice(1);
    cardsRef.current = rest;
    const next = draw();
    const list = [...rest, next];
    cardsRef.current = list;
    setCards(list);
    setShown((n) => n + 1);
    if (remote.current.length < 6) void refill();
  }, [draw, refill]);

  return { cards, shown, advance };
}
