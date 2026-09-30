"use client";

import { useStore } from "@/lib/store";

export function UndoBar() {
  const { undoLabel, undoDelete } = useStore();
  if (!undoLabel) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 left-0 right-0 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--ink)] px-4 py-2 text-sm text-[#fafafa] shadow-[var(--shadow)]">
        <span>{undoLabel}</span>
        <button type="button" onClick={undoDelete} className="font-medium text-[#5eead4]">
          Undo
        </button>
      </div>
    </div>
  );
}
