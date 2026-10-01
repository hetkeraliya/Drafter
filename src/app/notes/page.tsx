"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Fab } from "@/components/Fab";
import { MenuSheet } from "@/components/MenuSheet";
import { NoteCard } from "@/components/NoteCard";
import { Phone } from "@/components/Phone";
import { Segmented } from "@/components/Segmented";
import { Spark } from "@/components/Spark";
import { TAGS } from "@/lib/templates";
import { withViewTransition } from "@/lib/motion";
import { useStore } from "@/lib/store";
import { useLiveThought } from "@/lib/useLiveThought";
import type { Tab } from "@/lib/types";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "todo", label: "To-Do" },
  { id: "images", label: "Images" },
  { id: "imported", label: "Imported" },
];

export default function NotesPage() {
  const { ready, notes, toggleItem, prefs, setSort, pinNote, remindNote } = useStore();
  const [tab, setTab] = useState<Tab>("all");
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const router = useRouter();
  const { thought: daily, status } = useLiveThought();

  useEffect(() => {
    if (!ready || !("Notification" in window) || Notification.permission !== "granted") return;
    notes.forEach((note) => {
      if (note.remindAt && new Date(note.remindAt).getTime() <= Date.now()) {
        new Notification("Draftr", { body: note.title || "A note is waiting" });
        remindNote(note.id, null);
      }
    });
  }, [ready, notes]);

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
    const sorted = [...list].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      if (prefs.sort === "old") return a.updatedAt.localeCompare(b.updatedAt);
      if (prefs.sort === "type") return a.type.localeCompare(b.type) || b.updatedAt.localeCompare(a.updatedAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return sorted;
  }, [notes, tab, query, tag, prefs.sort]);

  if (!ready) return null;

  return (
    <Phone wide>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--ink)] text-[#fafafa]">
            <Spark size={15} />
          </span>
          <p className="text-[17px] font-semibold tracking-[-0.03em]">Draftr</p>
        </div>
        <button type="button" onClick={() => setMenu(true)} className="btn-ghost min-h-11 text-sm">
          Menu
        </button>
      </div>

      <button
        type="button"
        onClick={() => withViewTransition(() => router.push("/thought"))}
        className="card tilt mt-8 w-full p-5 text-left"
      >
        <p className="meta">Today’s Thought</p>
        <p className="mt-2 max-w-[20ch] text-[22px] font-semibold leading-tight tracking-[-0.04em]">{daily.headline}</p>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{daily.body}</p>
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          {status === "loading" ? "Looking up today’s line…" : status === "live" ? `Fresh today${daily.source ? ` · ${daily.source}` : ""}` : "Saved on this device"}
        </p>
      </button>

      <div className="rise-late mt-8">
        <h1 className="text-[48px] font-semibold leading-none tracking-[-0.06em]">Notes</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {notes.length} saved on this device
          {prefs.streak ? ` · ${prefs.streak}-day streak` : ""}
        </p>
      </div>

      <input
        className="field mt-6"
        placeholder="Search notes"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {(["new", "old", "type"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setSort(mode)}
            className={`chip ${prefs.sort === mode ? "bg-[var(--ink)] text-[#fafafa]" : ""}`}
          >
            {mode === "new" ? "Newest" : mode === "old" ? "Oldest" : "Type"}
          </button>
        ))}
        {TAGS.map((item) => (
          <button key={item} type="button" onClick={() => setTag(tag === item ? "" : item)} className={`chip ${tag === item ? "bg-[var(--ink)] text-[#fafafa]" : ""}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Segmented items={TABS} value={tab} onChange={setTab} />
      </div>

      {filtered.length === 0 ? (
        <div className="card tile mt-8 px-6 py-16 text-center">
          <p className="text-[28px] font-semibold tracking-[-0.045em]">{tab === "todo" ? "No lists yet" : tab === "images" ? "No photos yet" : tab === "imported" ? "No files yet" : "Nothing here yet"}</p>
          <p className="mx-auto mt-2 max-w-[36ch] text-sm text-[var(--muted)]">Add a note, list, photo, voice memo, or file.</p>
          <button type="button" onClick={() => withViewTransition(() => router.push("/notes/new?type=text"))} className="btn mt-7">
            New note
          </button>
        </div>
      ) : (
        <div key={`${tab}-${prefs.sort}-${tag}`} className="mt-6 columns-1 gap-3 sm:columns-2 xl:columns-3">
          {filtered.map((note, i) => (
            <div key={note.id} className="tile mb-3 break-inside-avoid" style={{ ["--i" as string]: i }}>
              <NoteCard note={note} onToggle={(itemId) => toggleItem(note.id, itemId)} onPin={() => pinNote(note.id)} />
            </div>
          ))}
        </div>
      )}

      <Fab />
      <MenuSheet open={menu} onClose={() => setMenu(false)} />
    </Phone>
  );
}
