"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuSheet } from "@/components/MenuSheet";
import { withViewTransition } from "@/lib/motion";
import { newId, useStore } from "@/lib/store";
import { gradientFor, thoughtAt, thoughtCount } from "@/lib/thoughts";
import { useLibrary } from "@/lib/useLibrary";
import { useLiveThought } from "@/lib/useLiveThought";
import type { DailyThought } from "@/lib/types";

export default function ThoughtPage() {
  const { ready, upsertNote } = useStore();
  const { thought: live } = useLiveThought();
  const library = useLibrary();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const feed = useMemo(() => {
    const stack = Array.from({ length: thoughtCount() }, (_, index) => thoughtAt(index));
    const list = [live, ...stack.filter((item) => item.headline !== live.headline)];
    return list.map((item) => ({ ...item, gradient: gradientFor(item.headline + item.body) }));
  }, [live]);

  if (!ready) return null;

  function keep(thought: DailyThought, gradient: string) {
    library.save(thought, gradient);
    const now = new Date().toISOString();
    upsertNote({
      id: `library-${thought.headline.slice(0, 18).replace(/\s+/g, "-").toLowerCase()}`,
      title: thought.headline,
      body: `${thought.body}\n\n${thought.prompt}`,
      type: "text",
      tint: "sky",
      items: [],
      attachments: [],
      createdAt: now,
      updatedAt: now,
      tags: ["ideas", "today"],
    });
  }

  return (
    <div className="relative h-dvh bg-black text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          onClick={() => withViewTransition(() => router.push("/notes"))}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/25 text-xl"
          aria-label="Back to notes"
        >
          ‹
        </button>
        <button type="button" onClick={() => setShowLibrary(true)} className="pointer-events-auto rounded-full bg-black/25 px-4 py-2 text-sm">
          Library {library.items.length}
        </button>
        <button type="button" onClick={() => setMenu(true)} className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/25" aria-label="Menu">
          ···
        </button>
      </div>

      <div className="h-dvh snap-y snap-mandatory overflow-y-scroll">
        {feed.map((thought, index) => {
          const saved = library.has(thought.headline);
          return (
            <section key={`${thought.headline}-${index}`} className="relative flex h-dvh snap-start snap-always flex-col justify-end px-6 pb-16 pt-24" style={{ background: thought.gradient }}>
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/70">{index === 0 ? "Today" : `Thought ${index + 1}`}</p>
              <h1 className="mt-3 max-w-[14ch] text-[40px] font-semibold leading-[1.02] tracking-[-0.05em]">{thought.headline}</h1>
              <p className="mt-4 max-w-[34ch] text-[16px] leading-7 text-white/85">{thought.body}</p>
              <p className="mt-4 text-sm text-white/75">{thought.prompt}</p>
              <div className="mt-8 flex gap-2">
                <button type="button" onClick={() => keep(thought, thought.gradient)} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                  {saved ? "Saved" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = newId();
                    const now = new Date().toISOString();
                    upsertNote({
                      id,
                      title: thought.headline,
                      body: `${thought.body}\n\n${thought.prompt}\n`,
                      type: "text",
                      tint: "cream",
                      items: [],
                      attachments: [],
                      createdAt: now,
                      updatedAt: now,
                      tags: ["ideas"],
                    });
                    withViewTransition(() => router.push(`/notes/${id}`));
                  }}
                  className="rounded-full bg-white/15 px-4 py-2 text-sm"
                >
                  Write
                </button>
              </div>
              {index === 0 && <p className="mt-6 text-[12px] text-white/70">Swipe up for the next thought</p>}
            </section>
          );
        })}
      </div>

      {showLibrary && (
        <div className="fixed inset-0 z-30 overflow-auto bg-[#12141a] p-5 text-[var(--ink)]">
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
                {library.items.map((item) => (
                  <article key={item.headline} className="rounded-[18px] p-5 text-white" style={{ background: item.gradient }}>
                    <p className="text-lg font-semibold">{item.headline}</p>
                    <p className="mt-2 text-sm text-white/80">{item.body}</p>
                    <button type="button" className="mt-4 text-sm underline" onClick={() => library.remove(item.headline)}>
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <MenuSheet open={menu} onClose={() => setMenu(false)} />
    </div>
  );
}
