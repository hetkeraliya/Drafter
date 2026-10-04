"use client";

import { useRef, useState } from "react";
import { haptic } from "@/lib/haptic";
import { newId, useStore } from "@/lib/store";
import { useNav } from "@/lib/useNav";
import type { Note } from "@/lib/types";
import { CheckIcon, PlusIcon } from "./Icons";

type Kind = "memo" | "todo";

// One round button. It opens a single line at the bottom of the screen: type, tick, done.
export function QuickAdd({ folderId }: { folderId: string | null }) {
  const { upsertNote } = useStore();
  const nav = useNav();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<Kind>("memo");
  const input = useRef<HTMLTextAreaElement>(null);

  function show() {
    setOpen(true);
    // focus inside the tap so the keyboard opens on iPhone
    input.current?.focus();
  }

  function hide() {
    input.current?.blur();
    setOpen(false);
  }

  function save() {
    const value = text.trim();
    if (!value) return;
    const now = new Date().toISOString();
    const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
    const note: Note =
      kind === "todo"
        ? {
            id: newId(),
            title: "To-do",
            body: "",
            type: "todo",
            tint: "mint",
            items: lines.map((label) => ({ id: newId(), label, checked: false })),
            attachments: [],
            createdAt: now,
            updatedAt: now,
            parentId: folderId,
          }
        : {
            id: newId(),
            title: lines[0].slice(0, 60),
            body: lines.slice(1).join("\n") || (lines[0].length > 60 ? lines[0] : ""),
            type: "text",
            tint: "cream",
            items: [],
            attachments: [],
            createdAt: now,
            updatedAt: now,
            parentId: folderId,
          };
    upsertNote(note);
    haptic(10);
    setText("");
    input.current?.focus(); // stay open, ready for the next one
  }

  const go = (type: string) => {
    hide();
    nav.go(`/notes/new?type=${type}${folderId ? `&folder=${folderId}` : ""}`, "up");
  };

  return (
    <>
      {!open && (
        <button type="button" className="add-fab" aria-label="New note" onClick={show}>
          <PlusIcon size={26} />
        </button>
      )}

      <div className="add-bar" data-open={open} inert={!open}>
        <div className="add-types">
          <button type="button" className="add-type" aria-pressed={kind === "memo"} onClick={() => setKind("memo")}>
            Memo
          </button>
          <button type="button" className="add-type" aria-pressed={kind === "todo"} onClick={() => setKind("todo")}>
            To-do
          </button>
          <span className="add-sep" aria-hidden />
          <button type="button" className="add-type" onClick={() => go("images")}>
            Photo
          </button>
          <button type="button" className="add-type" onClick={() => go("audio")}>
            Voice
          </button>
          <button type="button" className="add-type" onClick={() => go("file")}>
            File
          </button>
          <button type="button" className="add-type ml-auto" onClick={hide}>
            Close
          </button>
        </div>
        <div className="add-row">
          <textarea
            ref={input}
            rows={1}
            value={text}
            placeholder={kind === "todo" ? "One item per line" : "Write something"}
            aria-label="New note"
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
          />
          <button type="button" className="add-send" aria-label="Save note" disabled={!text.trim()} onClick={save}>
            <CheckIcon size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
