"use client";

import type { Note } from "@/lib/types";
import { rowTime } from "@/lib/format";
import { useNav } from "@/lib/useNav";
import { Check } from "./Check";
import { DocsIcon, PinFilledIcon, PinIcon, PlayIcon, TrashIcon } from "./Icons";
import { SwipeRow } from "./SwipeRow";
import { Waveform } from "./Waveform";

export function noteHref(note: Note) {
  const isThought = note.id === "thought" || note.id === "daily-thought" || /today.?s thought|thought of the day/i.test(note.title);
  return isThought ? "/thought" : `/notes/${note.id}`;
}

export function NoteRow({
  note,
  onToggle,
  onPin,
  onDelete,
  index = 0,
}: {
  index?: number;
  note: Note;
  onToggle: (itemId: string) => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const nav = useNav();
  const href = noteHref(note);
  const image = note.attachments.find((a) => (a.kind === "image" || a.kind === "sketch") && a.url);
  const parents = note.items.filter((item) => !item.parentId);
  const done = parents.filter((item) => item.checked).length;
  const open = () => nav.go(href);

  const snippet =
    note.type === "todo"
      ? parents.length
        ? `${done} of ${parents.length} done`
        : "No items"
      : note.type === "audio"
        ? "Voice memo"
        : note.type === "file"
          ? note.attachments[0]?.name || "Attached file"
          : note.type === "images"
            ? `${note.attachments.length} ${note.attachments.length === 1 ? "photo" : "photos"}`
            : note.body.replace(/\s+/g, " ").trim() || "No additional text";

  return (
    <SwipeRow
      index={index}
      leading={[{ label: note.pinned ? "Unpin" : "Pin", icon: <PinIcon size={20} />, color: "var(--orange)", run: onPin }]}
      trailing={[{ label: "Delete", icon: <TrashIcon size={20} />, color: "var(--red)", run: onDelete }]}
    >
      <div
        role="link"
        tabIndex={0}
        className="cell tappable items-start gap-3 py-3"
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter") open();
        }}
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[17px] font-semibold leading-snug">
            {note.pinned && (
              <span className="flex-none text-[var(--orange)]">
                <PinFilledIcon size={12} />
              </span>
            )}
            <span className="truncate">{note.title || "Untitled"}</span>
          </p>
          <p className="mt-0.5 flex gap-2 text-[15px] leading-snug text-[var(--muted)]">
            <time className="flex-none">{rowTime(note.updatedAt)}</time>
            <span className="truncate">{snippet}</span>
          </p>

          {note.type === "todo" && parents.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {parents.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center gap-2.5 text-[15px]" data-no-swipe>
                  <Check small checked={item.checked} onToggle={() => onToggle(item.id)} label={item.label} />
                  <span className={`strike truncate ${item.checked ? "" : ""}`} data-on={item.checked}>
                    {item.label}
                  </span>
                </li>
              ))}
              {parents.length > 3 && <li className="pl-[30px] text-[13px] text-[var(--muted)]">+{parents.length - 3} more</li>}
            </ul>
          )}

          {note.type === "audio" && (
            <div className="mt-2 flex items-center gap-3 text-[var(--tint)]">
              <PlayIcon size={14} />
              <Waveform bars={14} />
            </div>
          )}
        </div>

        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" className="thumb media-in" loading="lazy" />
        ) : note.type === "file" ? (
          <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-lg bg-[var(--fill)] text-[var(--muted)]">
            <DocsIcon size={24} />
          </span>
        ) : null}
      </div>
    </SwipeRow>
  );
}
