"use client";

import { useStore } from "@/lib/store";

export function UndoBar() {
  const { undoLabel, undoDelete, notice } = useStore();
  const text = undoLabel || notice;
  if (!text) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: "calc(66px + env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
    >
      <div
        key={text}
        className="toast pointer-events-auto flex items-center gap-4 rounded-full border border-[var(--line)] bg-[var(--material)] py-2.5 pl-5 pr-3 text-[15px] shadow-[var(--shadow-float)] backdrop-blur-xl"
      >
        <span>{text}</span>
        {undoLabel && (
          <button type="button" onClick={undoDelete} className="min-h-8 rounded-full px-2 font-semibold text-[var(--tint)]">
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
