"use client";

import { useEffect, useMemo, useState } from "react";
import { Fab } from "@/components/Fab";
import { ChevronRight, EllipsisIcon, SearchIcon, XCircleIcon } from "@/components/Icons";
import { MenuSheet } from "@/components/MenuSheet";
import { NoteRow } from "@/components/NoteRow";
import { Screen } from "@/components/Screen";
import { Segmented } from "@/components/Segmented";
import { sectionize } from "@/lib/format";
import { useStore } from "@/lib/store";
import { TAGS } from "@/lib/templates";
import { gradientFor } from "@/lib/thoughts";
import type { Tab } from "@/lib/types";
import { useLiveThought } from "@/lib/useLiveThought";
import { useNav } from "@/lib/useNav";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "todo", label: "To-Do" },
  { id: "images", label: "Images" },
  { id: "imported", label: "Imported" },
];

const SORTS = [
  { id: "new", label: "Newest" },
  { id: "old", label: "Oldest" },
  { id: "type", label: "Type" },
] as const;

export default function NotesPage() {
  const { ready, notes, toggleItem, prefs, setSort, pinNote, remindNote, deleteNote, loadSamples } = useStore();
  const [tab, setTab] = useState<Tab>("all");
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const nav = useNav();
  const { thought: daily, status } = useLiveThought();

  useEffect(() => {
    if (!ready || !("Notification" in window) || Notification.permission !== "granted") return;
    notes.forEach((note) => {
      if (note.remindAt && new Date(note.remindAt).getTime() <= Date.now()) {
        new Notification("Draftr", { body: note.title || "A note is waiting" });
        remindNote(note.id, null);
      }
    });
  }, [ready, notes, remindNote]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = notes;
    if (tab === "todo") list = list.filter((n) => n.type === "todo");
    else if (tab === "images") list = list.filter((n) => n.type === "images");
    else if (tab === "imported") list = list.filter((n) => n.type === "file");
    if (tag) list = list.filter((n) => n.tags?.includes(tag));
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.items.some((item) => item.label.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => {
      if (prefs.sort === "old") return a.updatedAt.localeCompare(b.updatedAt);
      if (prefs.sort === "type") return a.type.localeCompare(b.type) || b.updatedAt.localeCompare(a.updatedAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [notes, tab, query, tag, prefs.sort]);

  const sections = useMemo(() => sectionize(filtered, prefs.sort), [filtered, prefs.sort]);

  if (!ready) return null;

  const searching = query.trim() !== "" || tag !== "" || tab !== "all";
  let rowIndex = 0;

  return (
    <>
      <Screen
        title="Notes"
        large
        trailing={
          <button type="button" className="nav-btn" onClick={() => setMenu(true)} aria-label="Menu">
            <EllipsisIcon size={28} />
          </button>
        }
        footer={<Fab count={notes.length} streak={prefs.streak} />}
      >
        <div className="search">
          <span className="glass">
            <SearchIcon />
          </span>
          <input
            type="search"
            enterKeyHint="search"
            autoCorrect="off"
            placeholder="Search"
            aria-label="Search notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="clear" onClick={() => setQuery("")} aria-label="Clear search">
              <XCircleIcon size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => nav.go("/thought")}
          className="press relative mt-4 block w-full overflow-hidden rounded-[26px] border border-white/30 p-5 text-left text-white shadow-[var(--shadow-float)]"
          style={{ background: gradientFor(daily.headline) }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,0.35),transparent_55%)]" />
          <p className="relative text-[13px] font-semibold opacity-80">Today’s Thought</p>
          <p className="relative mt-1.5 text-[24px] font-bold leading-[1.14] tracking-[-0.03em]">{daily.headline}</p>
          <p className="relative mt-2 line-clamp-2 text-[15px] leading-snug opacity-90">{daily.body}</p>
          <p className="relative mt-3 flex items-center gap-0.5 text-[13px] font-medium opacity-85">
            {status === "loading" ? "Finding today’s line…" : "Swipe through more thoughts"}
            <ChevronRight size={13} />
          </p>
        </button>

        <div className="mt-5">
          <Segmented items={TABS} value={tab} onChange={setTab} />
        </div>

        <div className="chips mt-3">
          {SORTS.map((mode) => (
            <button key={mode.id} type="button" className="chip" aria-pressed={prefs.sort === mode.id} onClick={() => setSort(mode.id)}>
              {mode.label}
            </button>
          ))}
          <span className="mx-1 my-1.5 w-px flex-none bg-[var(--line)]" aria-hidden />
          {TAGS.map((item) => (
            <button key={item} type="button" className="chip" aria-pressed={tag === item} onClick={() => setTag(tag === item ? "" : item)}>
              {item}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="fade-up px-6 pb-10 pt-20 text-center">
            <p className="text-[22px] font-bold tracking-[-0.025em]">{searching ? "No Results" : "No Notes"}</p>
            <p className="mx-auto mt-1.5 max-w-[30ch] text-[15px] text-[var(--muted)]">
              {searching ? "Try a different search, tab or tag." : "Write a note, make a list, or add a photo, voice memo or file."}
            </p>
            {!searching && (
              <div className="mt-6 flex flex-col items-center gap-1">
                <button type="button" className="btn btn-sm" onClick={() => nav.go("/notes/new?type=text", "up")}>
                  New Note
                </button>
                <button type="button" className="btn-plain" onClick={loadSamples}>
                  Load sample notes
                </button>
              </div>
            )}
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.key}>
              <h2 className="group-title">{section.title}</h2>
              <div className="group">
                {section.notes.map((note) => (
                  <NoteRow
                    key={note.id}
                    index={rowIndex++}
                    note={note}
                    onToggle={(itemId) => toggleItem(note.id, itemId)}
                    onPin={() => pinNote(note.id)}
                    onDelete={() => deleteNote(note.id)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </Screen>
      <MenuSheet open={menu} onClose={() => setMenu(false)} />
    </>
  );
}
