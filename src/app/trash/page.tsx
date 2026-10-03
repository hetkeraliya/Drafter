"use client";

import { Screen } from "@/components/Screen";
import { SwipeRow } from "@/components/SwipeRow";
import { TrashIcon } from "@/components/Icons";
import { rowTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function TrashPage() {
  const { ready, trash, restoreNote, purgeNote } = useStore();

  if (!ready) return null;

  return (
    <Screen title="Trash" large back={{ href: "/notes", label: "Notes" }}>
      {trash.length === 0 ? (
        <div className="fade-up px-6 pt-24 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--fill)] text-[var(--muted)]">
            <TrashIcon size={28} />
          </span>
          <p className="mt-5 text-[22px] font-bold tracking-[-0.025em]">Trash is Empty</p>
          <p className="mx-auto mt-1.5 max-w-[30ch] text-[15px] text-[var(--muted)]">Deleted notes show up here until you remove them.</p>
        </div>
      ) : (
        <>
          <div className="group mt-2">
            {trash.map((note) => (
              <SwipeRow
                key={note.id}
                leading={[{ label: "Restore", color: "var(--tint)", run: () => restoreNote(note.id) }]}
                trailing={[{ label: "Delete", color: "var(--red)", run: () => purgeNote(note.id) }]}
              >
                <div className="cell">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{note.title || "Untitled"}</p>
                    <p className="text-[15px] text-[var(--muted)]">Deleted {note.deletedAt ? rowTime(note.deletedAt) : ""}</p>
                  </div>
                  <button type="button" data-no-swipe className="btn-plain min-h-9 px-2 text-[15px]" onClick={() => restoreNote(note.id)}>
                    Restore
                  </button>
                  <button type="button" data-no-swipe className="btn-plain min-h-9 px-2 text-[15px] !text-[var(--red)]" onClick={() => purgeNote(note.id)}>
                    Delete
                  </button>
                </div>
              </SwipeRow>
            ))}
          </div>
          <p className="group-foot">Swipe a note, or use the buttons. Deleting here removes it for good.</p>
        </>
      )}
    </Screen>
  );
}
