"use client";

import { useEffect, useState } from "react";
import type { DailyThought } from "./types";

const KEY = "draftr.thought.library.v1";

export interface SavedThought extends DailyThought {
  savedAt: string;
  gradient: string;
}

export function useLibrary() {
  const [items, setItems] = useState<SavedThought[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  function write(next: SavedThought[]) {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  function save(thought: DailyThought, gradient: string) {
    if (items.some((item) => item.headline === thought.headline)) return;
    write([{ ...thought, gradient, savedAt: new Date().toISOString() }, ...items]);
  }

  function remove(headline: string) {
    write(items.filter((item) => item.headline !== headline));
  }

  function has(headline: string) {
    return items.some((item) => item.headline === headline);
  }

  return { items, save, remove, has };
}
