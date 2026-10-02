"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuSheet } from "@/components/MenuSheet";
import { SwipeCard, type FlyFn } from "@/components/SwipeCard";
import { withViewTransition } from "@/lib/motion";
import { newId, useStore } from "@/lib/store";
import { useLibrary } from "@/lib/useLibrary";
import { useThoughtDeck, type ThoughtCard } from "@/lib/useThoughtDeck";
import type { DailyThought } from "@/lib/types";

function palette(ink: "light" | "dark") {
  return ink === "light"
    ? { main: "#ffffff", soft: "rgba(255,255,255,0.84)", faint: "rgba(255,255,255,0.64)", chip: "rgba(255,255,255,0.18)", on: "#14161c" }
    : { main: "#15171d", soft: "rgba(21,23,29,0.80)", faint: "rgba(21,23,29,0.58)", chip: "rgba(21,23,29,0.10)", on: "#ffffff" };
}

function headlineSize(text: string) {
  if (text.length <= 44) return "text-[40px] leading-[1.04]";
  if (text.length <= 90) return "text-[30px] leading-[1.1]";
  return "text-[24px] leading-[1.16]";
}

export default function ThoughtPage() {
  const { ready, upsertNote } = useStore();
  const library = useLibrary();
  const router = useRouter();
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
    withViewTransition(() => router.push(`/notes/${id}`));
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[#0b0d12] text-white">
      {top && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 scale-125 opacity-45 blur-3xl"
          style={{ background: top.gradient }}
        />
      )}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          onClick={() => withViewTransition(() => router.push("/notes"))}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/30 text-xl backdrop-blur"
          aria-label="Back to notes"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="pointer-events-auto rounded-full bg-black/30 px-4 py-2 text-sm backdrop-blur"
        >
          Library {library.items.length}
        </button>
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/30 backdrop-blur"
          aria-label="Menu"
        >
          ···
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-14 top-[72px] flex justify-center px-5">
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
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{ background: c.main, color: c.on }}
                  >
                    {saved ? "Saved" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => write(card)}
                    className="rounded-full px-4 py-2 text-sm"
                    style={{ background: c.chip, color: c.main }}
                  >
                    Write
                  </button>
                  <span className="ml-auto text-[11px]" style={{ color: c.faint }}>
                    {card.live ? `Quote · ${card.source || "Public"}` : "Draftr"}
                  </span>
                </div>
              </SwipeCard>
            );
          })}
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs text-white/60">
        {shown === 0 ? "Tap the card or swipe sideways for the next thought" : "Tap or swipe for another"}
      </p>

      {showLibrary && (
        <div className="fixed inset-0 z-40 overflow-auto bg-[#12141a] p-5">
          <div className="mx-auto max-w-[720px]">
            <div className="flex items-center justify-between text-white">
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">Thought library</h2>
              <button type="button" className="rounded-full bg-white/10 px-4 py-2 text-sm" onClick={() => setShowLibrary(false)}>
                Close
              </button>
            </div>
            {library.items.length === 0 ? (
              <p className="mt-8 text-sm text-white/70">Saved thoughts will live here.</p>
            ) : (
              <div className="mt-6 space-y-3">
                {library.items.map((item) => {
                  const c = palette(item.ink || "light");
                  return (
                    <article key={item.headline} className="rounded-[18px] p-5" style={{ background: item.gradient, color: c.main }}>
                      <p className="text-lg font-semibold">{item.headline}</p>
                      <p className="mt-2 text-sm" style={{ color: c.soft }}>
                        {item.body}
                      </p>
                      <button type="button" className="mt-4 text-sm underline" onClick={() => library.remove(item.headline)}>
                        Remove
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <MenuSheet open={menu} onClose={() => setMenu(false)} />
    </div>
  );
}
