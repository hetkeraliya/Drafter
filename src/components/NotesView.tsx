"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Canvas } from "@/components/Canvas";
import { ChevronDown, ChevronLeft, MicIcon, PlusIcon, SearchIcon, SpinIcon, ViewIcon, XIcon } from "@/components/Icons";
import { MenuSheet } from "@/components/MenuSheet";
import { NoteGrid } from "@/components/NoteGrid";
import { QuickAdd } from "@/components/QuickAdd";
import { Screen } from "@/components/Screen";
import { noteHref } from "@/components/Tile";
import { openDesk } from "@/lib/deskBus";
import { useStore } from "@/lib/store";
import { childrenOf, descendantIds, liveIndex } from "@/lib/tree";
import type { Note } from "@/lib/types";
import { useNav } from "@/lib/useNav";

function matches(note: Note, q: string) {
  return (
    note.title.toLowerCase().includes(q) ||
    note.body.toLowerCase().includes(q) ||
    Boolean(note.tags?.some((t) => t.toLowerCase().includes(q))) ||
    note.items.some((item) => item.label.toLowerCase().includes(q))
  );
}

// The home screen, and the inside of any folder. folderId null means the top level.
export function NotesView({ folderId }: { folderId: string | null }) {
  const { ready, notes, user, prefs, setView, patchNote, reorder, moveInto, stackNotes, deleteMany, remindNote, placeOn, placeMany } = useStore();
  const nav = useNav();
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [ask, setAsk] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => liveIndex(notes), [notes]);
  const folder = folderId ? index.get(folderId) : null;
  const parentFolder = folder?.parentId && index.get(folder.parentId)?.type === "folder" ? folder.parentId : null;
  const siblings = useMemo(() => childrenOf(notes, folderId), [notes, folderId]);
  const q = query.trim().toLowerCase();

  // the ids that match a search (a folder matches when something inside it does)
  const hits = useMemo(() => {
    if (!q) return null;
    const set = new Set<string>();
    for (const n of siblings) {
      if (n.type === "folder") {
        if (matches(n, q) || descendantIds(notes, n.id).some((id) => index.get(id) && matches(index.get(id)!, q))) set.add(n.id);
      } else if (matches(n, q)) set.add(n.id);
    }
    return set;
  }, [q, siblings, notes, index]);

  const gridItems = useMemo(() => (hits ? siblings.filter((n) => hits.has(n.id)) : siblings), [hits, siblings]);

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
          <p className="text-[20px] font-bold tracking-[-0.03em]">Folder not found</p>
          <p className="mt-1.5 text-[15px] text-[var(--muted)]">It may have been deleted.</p>
        </div>
      </Screen>
    );
  }

  const backHref = parentFolder ? `/folders/${parentFolder}` : "/notes";
  const grid = prefs.view === "grid";
  const initial = (user?.name || "D").trim().charAt(0).toUpperCase() || "D";
  const folderQuery = folderId ? `&folder=${folderId}` : "";

  function openAdd() {
    flushSync(() => setAdding(true));
    document.getElementById("quick-input")?.focus();
  }

  function stopSearch() {
    setQuery("");
    setSearching(false);
  }

  function leaveSelect() {
    setSelecting(false);
    setPicked(new Set());
  }

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const common = {
    open: (note: Note) => nav.go(noteHref(note)),
    stack: (dragged: string, target: string) => stackNotes(dragged, target),
    intoFolder: (dragged: string, target: string) => moveInto(dragged, target),
    toParent: (dragged: string) => moveInto(dragged, parentFolder),
    toggle,
  };

  return (
    <>
      <header className="top">
        <div className="top-row">
          <div className="top-left">
            {folder ? (
              <button type="button" data-drop="parent" className="icon-btn back-btn -ml-2" aria-label="Back" onClick={() => nav.back(backHref)}>
                <ChevronLeft size={22} />
              </button>
            ) : (
              <span className="avatar" aria-hidden>
                {initial}
              </span>
            )}
            {folder ? (
              <input
                className="top-title"
                value={folder.title}
                placeholder="Folder name"
                aria-label="Folder name"
                enterKeyHint="done"
                onChange={(e) => patchNote(folder.id, { title: e.target.value })}
              />
            ) : (
              <button type="button" className="top-title" onClick={() => setMenu(true)} aria-label="Menu">
                <span>Notes</span>
                <ChevronDown />
              </button>
            )}
          </div>
          {selecting ? (
            <button type="button" className="nav-btn strong" onClick={leaveSelect}>
              Done
            </button>
          ) : (
            <div className="flex items-center">
              {folder && (
                <button type="button" className="icon-btn" aria-label="Menu" onClick={() => setMenu(true)}>
                  <ChevronDown size={18} />
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                aria-label={grid ? "Show the desk" : "Show a grid"}
                onClick={() => setView(grid ? "canvas" : "grid")}
              >
                <ViewIcon grid={!grid} />
              </button>
            </div>
          )}
        </div>
        <p className="top-count">
          {siblings.length} {siblings.length === 1 ? "note" : "notes"}
        </p>
      </header>

      {siblings.length === 0 ? (
        <div className="fixed inset-0 grid place-items-center px-8 text-center">
          <div>
            <p className="text-[20px] font-bold tracking-[-0.03em]">{folder ? "Empty folder" : "No notes yet"}</p>
            <p className="mx-auto mt-1.5 max-w-[26ch] text-[15px] text-[var(--muted)]">
              {folder ? "Drop a card on this folder, or tap + to add one." : "Tap + to write your first note."}
            </p>
          </div>
        </div>
      ) : grid ? (
        <div className="grid-view">
          {gridItems.length === 0 ? (
            <p className="pt-24 text-center text-[15px] text-[var(--muted)]">Nothing found.</p>
          ) : (
            <NoteGrid
              items={gridItems}
              kidsOf={(id) => childrenOf(notes, id)}
              canDrag={!q && !selecting}
              selecting={selecting}
              selected={picked}
              hasParent={Boolean(folder)}
              actions={{ ...common, reorder: (ids) => reorder(ids, folderId) }}
            />
          )}
        </div>
      ) : (
        <Canvas
          items={siblings}
          kidsOf={(id) => childrenOf(notes, id)}
          selecting={selecting}
          selected={picked}
          dim={hits}
          focusId={focusId}
          onFocused={() => setFocusId(null)}
          actions={{ ...common, place: placeOn, placeMany }}
        />
      )}

      {selecting ? (
        <div className="select-bar">
          <span>{picked.size ? `${picked.size} selected` : "Select notes"}</span>
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
        !adding && (
          <div className="dock">
            {searching ? (
              <div className="dock-row">
                <label className="dock-ask">
                  <SearchIcon size={18} />
                  <input
                    ref={searchRef}
                    type="search"
                    enterKeyHint="search"
                    autoCorrect="off"
                    placeholder="Search notes"
                    aria-label="Search notes"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") stopSearch();
                    }}
                  />
                </label>
                <button type="button" className="icon-btn" aria-label="Close search" onClick={stopSearch}>
                  <XIcon size={20} />
                </button>
              </div>
            ) : (
              <div className="dock-row">
                <button type="button" className="icon-btn" aria-label="Search" onClick={() => setSearching(true)}>
                  <SearchIcon size={20} />
                </button>
                <form
                  className="dock-ask"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const question = ask.trim();
                    setAsk("");
                    openDesk({ text: "", question: question || undefined });
                  }}
                >
                  <SpinIcon size={17} />
                  <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Ask your notes" aria-label="Ask your notes" enterKeyHint="send" />
                </form>
                <button type="button" className="icon-btn" aria-label="Voice note" onClick={() => nav.go(`/notes/new?type=audio${folderQuery}`, "up")}>
                  <MicIcon size={21} />
                </button>
                <button type="button" className="dock-plus" aria-label="New note" onClick={openAdd}>
                  <PlusIcon size={22} />
                </button>
              </div>
            )}
          </div>
        )
      )}

      <QuickAdd
        folderId={folderId}
        open={adding && !selecting}
        onClose={() => setAdding(false)}
        onAdded={(id) => {
          setFocusId(id);
          if (grid) window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

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
