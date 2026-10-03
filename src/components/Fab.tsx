"use client";

import { useNav } from "@/lib/useNav";
import { ComposeIcon, MicIcon } from "./Icons";

// Bottom toolbar on the notes screen: voice note, count, compose.
export function Fab({ count, streak }: { count: number; streak: number }) {
  const nav = useNav();
  return (
    <footer className="toolbar">
      <div className="toolbar-inner">
        <div className="flex justify-start">
          <button type="button" className="tool-btn" aria-label="New voice note" onClick={() => nav.go("/notes/new?type=audio", "up")}>
            <MicIcon size={22} />
          </button>
        </div>
        <p className="text-center text-[11px] leading-tight text-[var(--muted)]">
          {count} {count === 1 ? "Note" : "Notes"}
          {streak > 1 && <span className="block">{streak}-day streak</span>}
        </p>
        <div className="flex justify-end">
          <button type="button" className="tool-btn" aria-label="New note" onClick={() => nav.go("/notes/new?type=text", "up")}>
            <ComposeIcon size={24} />
          </button>
        </div>
      </div>
    </footer>
  );
}
