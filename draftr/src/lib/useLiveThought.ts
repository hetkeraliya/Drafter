"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { thoughtForDate, todayKey } from "./thoughts";
import { useStore } from "./store";
import type { DailyThought } from "./types";

const CACHE_KEY = "draftr.daily.thought.v1";

function readCache(): DailyThought | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as DailyThought;
    if (saved.day !== todayKey()) return null;
    return saved;
  } catch {
    return null;
  }
}

export function useLiveThought() {
  const { ready, upsertNote } = useStore();
  const upsertRef = useRef(upsertNote);
  const savedDay = useRef("");
  const [thought, setThought] = useState<DailyThought>(thoughtForDate());
  const [status, setStatus] = useState<"loading" | "live" | "local">("loading");

  upsertRef.current = upsertNote;

  const putInNotes = useCallback((next: DailyThought) => {
    if (savedDay.current === next.day) return;
    savedDay.current = next.day;
    const now = new Date().toISOString();
    upsertRef.current({
      id: "daily-thought",
      title: "Today’s Thought",
      body: `${next.body}\n\n${next.prompt}`,
      type: "text",
      tint: "sky",
      items: [],
      attachments: [],
      createdAt: now,
      updatedAt: now,
      pinned: true,
      tags: ["today", "ideas"],
    });
  }, []);

  const load = useCallback(
    async (force = false) => {
      if (force) savedDay.current = "";
      if (!force) {
        const cached = readCache();
        if (cached) {
          setThought(cached);
          setStatus(cached.live ? "live" : "local");
          putInNotes(cached);
          return;
        }
      }
      setStatus("loading");
      try {
        const res = await fetch("/api/thought", { cache: "no-store" });
        if (!res.ok) throw new Error("lookup failed");
        const next = (await res.json()) as DailyThought;
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        setThought(next);
        setStatus(next.live ? "live" : "local");
        putInNotes(next);
      } catch {
        const local = thoughtForDate();
        setThought(local);
        setStatus("local");
      }
    },
    [putInNotes],
  );

  useEffect(() => {
    if (!ready) return;
    void load(false);
  }, [ready, load]);

  return { thought, status, refresh: () => load(true) };
}
