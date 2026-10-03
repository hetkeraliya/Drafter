"use client";

import { useEffect, useRef, useState } from "react";
import { MenuSheet } from "@/components/MenuSheet";
import { Sheet } from "@/components/Sheet";
import { SwipeCard, type FlyFn } from "@/components/SwipeCard";
import { EllipsisIcon, ChevronLeft } from "@/components/Icons";
import { newId, useStore } from "@/lib/store";
import { useNav } from "@/lib/useNav";
import { useLibrary } from "@/lib/useLibrary";
import { useThoughtDeck, type ThoughtCard } from "@/lib/useThoughtDeck";
import type { DailyThought } from "@/lib/types";

function palette(ink: "light" | "dark") {
  return ink === "light"
    ? { main: "#ffffff", soft: "rgba(255,255,255,0.8)", faint: "rgba(255,255,255,0.56)", chip: "rgba(255,255,255,0.16)", on: "#000000" }
    : { main: "#000000", soft: "rgba(0,0,0,0.76)", faint: "rgba(0,0,0,0.5)", chip: "rgba(0,0,0,0.09)", on: "#ffffff" };
}

function headlineSize(text: string) {
  if (text.length <= 44) return "text-[40px] leading-[1.04]";
  if (text.length <= 90) return "text-[30px] leading-[1.1]";
  return "text-[24px] leading-[1.16]";
}

export default function ThoughtPage() {
  const { ready, upsertNote } = useStore();
  const library = useLibrary();
  const nav = useNav();
  const { cards, shown, advance } = useThoughtDeck();
  const [menu, setMenu] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const flyRef = useRef<FlyFn | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (menu || showLibrary) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(input|textarea|select)$/i.test(el.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        flyRef.current?.(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        flyRef.current?.(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, showLibrary]);

  if (!ready) return null;

  const top = cards[0];

  function keep(card: ThoughtCard) {
    const thought: DailyThought = {
      day: card.day,
      headline: card.headline,
      body: card.body,
      prompt: card.prompt,
      author: card.author,
      source: card.source,
      live: card.live,
    };
    library.save(thought, card.gradient, card.ink);
    const now = new Date().toISOString();
    upsertNote({
      id: `library-${card.headline.slice(0, 18).replace(/\s+/g, "-").toLowerCase()}`,
      title: card.headline.length > 60 ? `${card.headline.slice(0, 57)}…` : card.headline,
      body: `${card.body}\n\n${card.prompt}`,
      type: "text",
      tint: "sky",
      items: [],
      attachments: [],
      createdAt: now,
      updatedAt: now,
      tags: ["ideas", "today"],
    });
  }

  function write(card: ThoughtCard) {
    const id = newId();
    const now = new Date().toISOString();
    upsertNote({
      id,
      title: card.headline.length > 60 ? `${card.headline.slice(0, 57)}…` : card.headline,
      body: `${card.body}\n\n${card.prompt}\n`,
      type: "text",
      tint: "cream",
      items: [],
      attachments: [],
      createdAt: now,
      updatedAt: now,
      tags: ["ideas"],
    });
    nav.go(`/notes/${id}`);
  }

  return (
    <div className="relative h-dvh overflow-hidden text-[var(--ink)]">
      {top && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 scale-125 opacity-30 blur-3xl"
          style={{ background: top.gradient }}
        />
      )}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => nav.back("/notes")}
          className="glass-pill pointer-events-auto !px-0"
          aria-label="Back to notes"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="glass-pill pointer-events-auto"
        >
          Library{library.items.length ? ` ${library.items.length}` : ""}
        </button>
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="glass-pill pointer-events-auto !px-0"
          aria-label="Menu"
        >
          <EllipsisIcon size={26} />
        </button>
      </div>

      <div className="absolute inset-x-0 flex justify-center px-5" style={{ top: "calc(env(safe-area-inset-top) + 64px)", bottom: "calc(env(safe-area-inset-bottom) + 52px)" }}>
        <div className="relative h-full max-h-[700px] w-full max-w-[420px] self-center">
          {cards.slice(0, 3).map((card, depth) => {
            const c = palette(card.ink);
            const saved = library.has(card.headline);
            return (
              <SwipeCard
                key={card.id}
                depth={depth}
                gradient={card.gradient}
                color={c.main}
                active={depth === 0}
                onGone={advance}
                register={(fn) => {
                  flyRef.current = fn;
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: c.faint }}>
                  Thought {shown + depth + 1}
                </p>
                <h1 className={`mt-3 font-semibold tracking-[-0.04em] ${headlineSize(card.headline)}`}>{card.headline}</h1>
                <p className="mt-4 text-[16px] leading-7" style={{ color: c.soft }}>
                  {card.body}
                </p>
                <p className="mt-4 text-sm" style={{ color: c.faint }}>
                  {card.prompt}
                </p>
                <div className="mt-7 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => keep(card)}
                    className="min-h-10 rounded-full px-5 text-[15px] font-semibold"
                    style={{ background: c.main, color: c.on }}
                  >
                    {saved ? "Saved" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => write(card)}
                    className="min-h-10 rounded-full px-5 text-[15px] font-medium"
                    style={{ background: c.chip, color: c.main }}
                  >
                    Write
                  </button>
                  <span className="ml-auto text-[11px]" style={{ color: c.faint }}>
                    {card.live ? card.source || "Quote" : "Draftr"}
                  </span>
                </div>
              </SwipeCard>
            );
          })}
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 text-center text-[13px] text-[var(--muted)]" style={{ bottom: "calc(env(safe-area-inset-bottom) + 18px)" }}>
        {shown === 0 ? "Tap the card or swipe sideways for the next thought" : "Tap or swipe for another"}
      </p>

      <Sheet
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        title="Thought Library"
        full
        action={
          <button type="button" className="nav-btn strong" onClick={() => setShowLibrary(false)}>
            Done
          </button>
        }
      >
        {library.items.length === 0 ? (
          <p className="px-4 pt-16 text-center text-[15px] text-[var(--muted)]">Saved thoughts will live here.</p>
        ) : (
          <div className="space-y-3 pt-1">
            {library.items.map((item) => {
              const c = palette(item.ink || "light");
              return (
                <article key={item.headline} className="rounded-[20px] p-5" style={{ background: item.gradient, color: c.main }}>
                  <p className="text-[19px] font-semibold leading-snug tracking-[-0.02em]">{item.headline}</p>
                  <p className="mt-2 text-[15px] leading-snug" style={{ color: c.soft }}>
                    {item.body}
                  </p>
                  <button type="button" className="mt-4 min-h-9 rounded-full px-4 text-[14px] font-medium" style={{ background: c.chip, color: c.main }} onClick={() => library.remove(item.headline)}>
                    Remove
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </Sheet>
      <MenuSheet open={menu} onClose={() => setMenu(false)} />
    </div>
  );
}
