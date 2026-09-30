"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Note } from "@/lib/types";
import { withViewTransition } from "@/lib/motion";
import { DocsIcon, PlayIcon } from "./Icons";
import { Waveform } from "./Waveform";

export function NoteCard({
  note,
  onToggle,
  onPin,
}: {
  note: Note;
  onToggle?: (id: string) => void;
  onPin?: () => void;
}) {
  const images = note.attachments.filter((a) => a.kind === "image" || a.kind === "sketch");
  const router = useRouter();
  const href =
    note.id === "thought" || note.id === "daily-thought" || /today.?s thought|thought of the day/i.test(note.title)
      ? "/thought"
      : `/notes/${note.id}`;

  return (
    <Link
      href={href}
      className="card block overflow-hidden p-4"
      onClick={(e) => {
        e.preventDefault();
        withViewTransition(() => router.push(href));
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="chip">{note.type}</span>
        <div className="flex items-center gap-2">
          {note.pinned && <span className="text-[11px] text-[var(--muted)]">pin</span>}
          <button
            type="button"
            className="text-[11px] text-[var(--muted)]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPin?.();
            }}
          >
            {note.pinned ? "Unpin" : "Pin"}
          </button>
          <time className="text-[11px] text-[var(--muted)]">
            {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </time>
        </div>
      </div>
      <h2 className="mt-3 line-clamp-2 text-[17px] font-medium leading-snug tracking-[-0.025em]">{note.title}</h2>

      {note.type === "todo" && (
        <ul className="mt-3 space-y-2 text-[13px]">
          {note.items.filter((item) => !item.parentId).slice(0, 3).map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <span
                onClick={(e) => {
                  e.preventDefault();
                  onToggle?.(item.id);
                }}
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border text-[10px] ${
                  item.checked ? "check-pop border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--ink)]"
                }`}
              >
                {item.checked ? "✓" : ""}
              </span>
              <span className={`line-clamp-1 ${item.checked ? "text-[var(--muted)] line-through" : ""}`}>{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {note.type === "text" && note.body && (
        <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-[var(--muted)]">{note.body}</p>
      )}

      {note.type === "audio" && (
        <div className="mt-4 flex items-center gap-3 text-[var(--ink)]">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--soft)]">
            <PlayIcon />
          </span>
          <Waveform bars={8} />
        </div>
      )}

      {note.type === "file" && (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-[var(--muted)]">
          <DocsIcon size={18} />
          <span className="line-clamp-1">{note.attachments[0]?.name || "Attached file"}</span>
        </div>
      )}

      {images.length > 0 && (
        <div className={`mt-3 grid gap-1.5 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.slice(0, 2).map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt="" className="media-in h-[92px] w-full rounded-[10px] object-cover" />
          ))}
        </div>
      )}
    </Link>
  );
}
