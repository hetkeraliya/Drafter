"use client";

import { useMemo } from "react";
import { descendantIds, liveIndex } from "@/lib/tree";
import { useStore } from "@/lib/store";
import { Sheet } from "./Sheet";

// Pick a folder to send the selected notes to.
export function MoveSheet({
  open,
  ids,
  currentId,
  onClose,
  onMoved,
}: {
  open: boolean;
  ids: string[];
  currentId: string | null;
  onClose: () => void;
  onMoved: () => void;
}) {
  const { notes, moveInto } = useStore();

  const folders = useMemo(() => {
    const blocked = new Set<string>(ids);
    ids.forEach((id) => descendantIds(notes, id).forEach((d) => blocked.add(d)));
    return [...liveIndex(notes).values()].filter((n) => n.type === "folder" && !blocked.has(n.id) && n.id !== currentId);
  }, [notes, ids, currentId]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Move to"
      animate={false}
      action={
        <button type="button" className="nav-btn strong" onClick={onClose}>
          Cancel
        </button>
      }
    >
      {folders.length === 0 ? (
        <p className="px-2 pt-8 text-center text-[15px] text-[var(--muted)]">No other folders yet.</p>
      ) : (
        <div className="group mt-2">
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className="cell"
              onClick={() => {
                ids.forEach((id) => moveInto(id, folder.id));
                onMoved();
              }}
            >
              <span className="flex-1 truncate">{folder.title || "Untitled folder"}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
