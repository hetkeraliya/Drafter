"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronDown, PlusIcon, SearchIcon, SpinIcon, XIcon } from "@/components/Icons";
import { MenuSheet } from "@/components/MenuSheet";
import { NoteGrid } from "@/components/NoteGrid";
import { QuickAdd } from "@/components/QuickAdd";
import { openDesk } from "@/lib/deskBus";
import { useStore } from "@/lib/store";
import { childrenOf, descendantIds, liveIndex } from "@/lib/tree";
import { useNav } from "@/lib/useNav";

// The first screen: just your folders. Open one to get the desk.
export function FoldersHome() {
  const { ready, notes, user, reorder, moveInto, remindNote } = useStore();
  const nav = useNav();
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [ask, setAsk] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => liveIndex(notes), [notes]);
  const top = useMemo(() => childrenOf(notes, null), [notes]);
  const q = query.trim().toLowerCase();

  const shown = useMemo(() => {
    if (!q) return top;
    const hit = (id: string) => {
      const n = index.get(id);
      return Boolean(
        n &&
          (n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q) ||
            n.items.some((i) => i.label.toLowerCase().includes(q)) ||
            n.tags?.some((t) => t.toLowerCase().includes(q))),
      );
    };
    return top.filter((f) => hit(f.id) || descendantIds(notes, f.id).some(hit));
  }, [q, top, notes, index]);

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

  const initial = (user?.name || "D").trim().charAt(0).toUpperCase() || "D";

  function openAdd() {
    flushSync(() => setAdding(true));
    document.getElementById("quick-input")?.focus();
  }

  return (
    <>
      <header className="top">
        <div className="top-row">
          <div className="top-left">
            <span className="avatar" aria-hidden>
              {initial}
            </span>
            <button type="button" className="top-title" onClick={() => setMenu(true)} aria-label="Menu">
              <span>Notes</span>
              <ChevronDown />
            </button>
          </div>
        </div>
        <p className="top-count">
          {top.length} {top.length === 1 ? "folder" : "folders"}
        </p>
      </header>

      {top.length === 0 ? (
        <div className="fixed inset-0 grid place-items-center px-8 text-center">
          <div>
            <p className="text-[20px] font-bold tracking-[-0.03em]">No folders yet</p>
            <p className="mx-auto mt-1.5 max-w-[26ch] text-[15px] text-[var(--muted)]">Tap + to make your first folder.</p>
          </div>
        </div>
      ) : (
        <div className="grid-view">
          {shown.length === 0 ? (
            <p className="pt-24 text-center text-[15px] text-[var(--muted)]">Nothing found.</p>
          ) : (
            <NoteGrid
              items={shown}
              kidsOf={(id) => childrenOf(notes, id)}
              canDrag={!q}
              selecting={false}
              selected={new Set()}
              hasParent={false}
              actions={{
                open: (note) => nav.go(`/folders/${note.id}`),
                reorder: (ids) => reorder(ids, null),
                stack: (dragged, target) => moveInto(dragged, target),
                intoFolder: (dragged, target) => moveInto(dragged, target),
                toParent: () => {},
                toggle: () => {},
              }}
            />
          )}
        </div>
      )}

      {!adding && (
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
                  placeholder="Search folders"
                  aria-label="Search folders"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close search"
                onClick={() => {
                  setQuery("");
                  setSearching(false);
                }}
              >
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
              <button type="button" className="dock-plus" aria-label="New folder" onClick={openAdd}>
                <PlusIcon size={22} />
              </button>
            </div>
          )}
        </div>
      )}

      <QuickAdd folderId={null} mode="folder" open={adding} onClose={() => setAdding(false)} />
      <MenuSheet open={menu} onClose={() => setMenu(false)} />
    </>
  );
}
