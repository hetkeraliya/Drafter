"use client";

import { useRouter } from "next/navigation";
import { Phone } from "@/components/Phone";
import { withViewTransition } from "@/lib/motion";
import { useStore } from "@/lib/store";

export default function TrashPage() {
  const { ready, trash, restoreNote, purgeNote } = useStore();
  const router = useRouter();

  if (!ready) return null;

  return (
    <Phone>
      <button type="button" onClick={() => withViewTransition(() => router.push("/notes"))} className="btn-ghost -ml-3">
        Back
      </button>
      <h1 className="mt-6 text-[34px] font-semibold leading-none tracking-[-0.045em]">Trash</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Notes wait here until you restore or remove them.</p>

      {trash.length === 0 ? (
        <div className="card mt-8 px-6 py-16 text-center">
          <p className="text-[24px] font-semibold tracking-[-0.04em]">Trash is empty</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Deleted notes will show up here.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {trash.map((note, i) => (
            <li key={note.id} className="card p-4" style={{ ["--i" as string]: i }}>
              <p className="text-sm font-medium">{note.title || "Untitled"}</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                {note.deletedAt ? new Date(note.deletedAt).toLocaleString() : "In trash"}
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn min-h-10 px-4 text-sm" onClick={() => restoreNote(note.id)}>
                  Restore
                </button>
                <button type="button" className="btn-ghost text-[var(--danger)]" onClick={() => purgeNote(note.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Phone>
  );
}
