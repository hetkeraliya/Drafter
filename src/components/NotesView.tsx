"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EllipsisIcon, SearchIcon, XCircleIcon } from "@/components/Icons";
import { MenuSheet } from "@/components/MenuSheet";
import { NoteGrid } from "@/components/NoteGrid";
import { noteHref } from "@/components/Tile";
import { QuickAdd } from "@/components/QuickAdd";
import { Screen } from "@/components/Screen";
import { useStore } from "@/lib/store";
import { childrenOf, liveIndex } from "@/lib/tree";
import { useNav } from "@/lib/useNav";

// The home screen, and the inside of any folder. folderId null means the top level.
export function NotesView({ folderId }: { folderId: string | null }) {
  const { ready, notes, patchNote, reorder, moveInto, stackNotes, deleteMany, remindNote } = useStore();
  const nav = useNav();
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => liveIndex(notes), [notes]);
  const folder = folderId ? index.get(folderId) : null;
  const parentFolder = folder?.parentId && index.get(folder.parentId)?.type === "folder" ? folder.parentId : null;

  const siblings = useMemo(() => childrenOf(notes, folderId), [notes, folderId]);
  const q = query.trim().toLowerCase();

  const items = useMemo(() => {
    if (!q) return siblings;
    // searching looks through every note, folders included
    return [...index.values()]
      .filter(
        (n) =>
          n.type !== "folder" &&
          (n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q) ||
            n.tags?.some((t) => t.toLowerCase().includes(q)) ||
            n.items.some((item) => item.label.toLowerCase().includes(q))),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [siblings, index, q]);

  useEffect(() => {
    if (!ready || !("Notification" in window) || Notification.permission !== "granted") return;
    notes.forEach((note) => {
      if (note.remindAt && new Date(note.remindAt).getTime() <= Date.now()) {
        new Notification("Draftr", { body: note.title || "A note is waiting" });
        remindNote(note.id, null);
      }
    });
  }, [ready, notes, remindNote]);

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

  if (!ready) return null;

  if (folderId && !folder) {
    return (
      <Screen back={{ href: "/notes", label: "Notes" }}>
        <div className="fade-up px-6 pt-24 text-center">
          <p className="text-[22px] font-bold tracking-[-0.03em]">Folder not found</p>
          <p className="mt-1.5 text-[15px] text-[var(--muted)]">It may have been deleted.</p>
        </div>
      </Screen>
    );
  }

  const backHref = parentFolder ? `/folders/${parentFolder}` : "/notes";
  const backLabel = parentFolder ? index.get(parentFolder)?.title || "Folder" : "Notes";

  function stopSearch() {
    setQuery("");
    setSearching(false);
  }

  function leaveSelect() {
    setSelecting(false);
    setPicked(new Set());
  }

  const trailing = selecting ? (
    <button type="button" className="nav-btn strong" onClick={leaveSelect}>
      Done
    </button>
  ) : (
    <>
      <button type="button" className="nav-btn" aria-label="Search" onClick={() => setSearching((v) => !v)}>
        <SearchIcon size={20} />
      </button>
      <button type="button" className="nav-btn" aria-label="Menu" onClick={() => setMenu(true)}>
        <EllipsisIcon size={26} />
      </button>
    </>
  );

  const title = folder ? folder.title || "Folder" : "Notes";

  return (
    <>
      <Screen
        title={title}
        back={folder ? { href: backHref, label: backLabel } : undefined}
        large={false}
        trailing={trailing}
      >
        {folder ? (
          <input
            className="folder-title"
            value={folder.title}
            placeholder="Folder name"
            aria-label="Folder name"
            enterKeyHint="done"
            onChange={(e) => patchNote(folder.id, { title: e.target.value })}
          />
        ) : (
          <h1 className="home-title">Notes</h1>
        )}

        {searching && (
          <div className="search fade-up mb-4">
            <span className="glass">
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              type="search"
              enterKeyHint="search"
              autoCorrect="off"
              placeholder="Search"
              aria-label="Search notes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") stopSearch();
              }}
            />
            <button type="button" className="clear" onClick={stopSearch} aria-label="Close search">
              <XCircleIcon size={16} />
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="px-6 pb-10 pt-24 text-center">
            <p className="text-[20px] font-semibold tracking-[-0.03em]">{q ? "Nothing found" : folder ? "Empty folder" : "No notes yet"}</p>
            <p className="mx-auto mt-1.5 max-w-[28ch] text-[15px] text-[var(--muted)]">
              {q ? "Try another word." : folder ? "Drag a note onto this folder, or tap + to add one." : "Tap + to write your first note."}
            </p>
          </div>
        ) : (
          <NoteGrid
            items={items}
            kidsOf={(id) => childrenOf(notes, id)}
            canDrag={!q && !selecting}
            selecting={selecting}
            selected={picked}
            hasParent={Boolean(folder)}
            actions={{
              open: (note) => nav.go(noteHref(note)),
              reorder: (ids) => reorder(ids, folderId),
              stack: (dragged, target) => stackNotes(dragged, target),
              intoFolder: (dragged, target) => moveInto(dragged, target),
              toParent: (dragged) => moveInto(dragged, parentFolder),
              toggle: (id) =>
                setPicked((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                }),
            }}
          />
        )}
      </Screen>

      {selecting ? (
        <div className="select-bar">
          <span>{picked.size ? `${picked.size} selected` : "Select items"}</span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={!picked.size}
            onClick={() => {
              deleteMany([...picked]);
              leaveSelect();
            }}
          >
            Delete
          </button>
        </div>
      ) : (
        <QuickAdd folderId={folderId} />
      )}

      <MenuSheet
        open={menu}
        onClose={() => setMenu(false)}
        onSelect={() => {
          setMenu(false);
          setSelecting(true);
        }}
      />
    </>
  );
}
