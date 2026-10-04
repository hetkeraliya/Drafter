"use client";

import type { Note } from "@/lib/types";
import { DocsIcon } from "./Icons";
import { Waveform } from "./Waveform";

export function noteHref(note: Note) {
  if (note.type === "folder") return `/folders/${note.id}`;
  const isThought = note.id === "thought" || note.id === "daily-thought" || /today.?s thought|thought of the day/i.test(note.title);
  return isThought ? "/thought" : `/notes/${note.id}`;
}

function Mini({ note }: { note: Note }) {
  const image = note.attachments.find((a) => (a.kind === "image" || a.kind === "sketch") && a.url);
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />;
  }
  if (note.type === "folder") return <span className="block h-full w-full rounded-[3px] border border-[var(--faint)]" />;
  const text = note.type === "todo" ? note.items.map((i) => i.label).join(" ") : note.body || note.title;
  return (
    <span className="block h-full w-full overflow-hidden p-[3px] text-[5px] leading-[1.25] text-[var(--muted)]">
      {text.slice(0, 40)}
    </span>
  );
}

// One card on the grid. Deliberately quiet: a title and a short preview, nothing else.
export function Tile({
  note,
  kids = [],
  selected = false,
  selecting = false,
}: {
  note: Note;
  kids?: Note[];
  selected?: boolean;
  selecting?: boolean;
}) {
  const image = note.attachments.find((a) => (a.kind === "image" || a.kind === "sketch") && a.url);
  const parents = note.items.filter((item) => !item.parentId);
  const title = note.title || "Untitled";

  let body: React.ReactNode = null;

  if (note.type === "folder") {
    const shown = kids.slice(0, 4);
    body = (
      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-1.5 pt-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="overflow-hidden rounded-[7px] bg-[var(--fill)]">
            {shown[i] && <Mini note={shown[i]} />}
          </span>
        ))}
      </div>
    );
  } else if (image) {
    body = (
      <div className="min-h-0 flex-1 overflow-hidden rounded-[var(--r-thumb)] bg-[var(--fill)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
      </div>
    );
  } else if (note.type === "todo") {
    body = (
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-hidden pt-0.5">
        {parents.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-[14px] leading-tight text-[var(--muted)]">
            <span
              className="h-3.5 w-3.5 flex-none rounded-full"
              style={{ boxShadow: item.checked ? "none" : "0 0 0 1.5px var(--faint) inset", background: item.checked ? "var(--ink)" : "transparent" }}
            />
            <span className={`truncate ${item.checked ? "line-through opacity-60" : ""}`}>{item.label}</span>
          </li>
        ))}
      </ul>
    );
  } else if (note.type === "audio") {
    body = (
      <div className="flex flex-1 items-center text-[var(--faint)]">
        <Waveform bars={16} />
      </div>
    );
  } else if (note.type === "file") {
    body = (
      <div className="flex flex-1 items-center gap-2 text-[var(--muted)]">
        <DocsIcon size={22} />
        <span className="truncate text-[14px]">{note.attachments[0]?.name || "File"}</span>
      </div>
    );
  } else {
    body = (
      <p className="line-clamp-5 flex-1 overflow-hidden text-[14px] leading-[1.4] text-[var(--muted)]">
        {note.body.replace(/\s+/g, " ").trim() || "No text"}
      </p>
    );
  }

  return (
    <div className="tile-face">
      {selecting && <span className="tile-check" data-on={selected} aria-hidden />}
      <p className="line-clamp-2 text-[16px] font-semibold leading-[1.2] tracking-[-0.02em]">{title}</p>
      {body}
      {note.type === "folder" && <p className="mt-2 text-[13px] text-[var(--muted)]">{kids.length} {kids.length === 1 ? "item" : "items"}</p>}
    </div>
  );
}
