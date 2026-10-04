"use client";

import { useRef, useState } from "react";
import { rowTime } from "@/lib/format";
import type { Note } from "@/lib/types";
import { DocsIcon, PlayIcon } from "./Icons";
import { Waveform } from "./Waveform";

function FolderGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.6l2 2.2h7.4A2.5 2.5 0 0 1 21 9.7v7.8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-10z" />
    </svg>
  );
}

function Play({ url }: { url: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      className="card-play"
      aria-label={on ? "Pause" : "Play"}
      disabled={!url}
      data-no-open
      onClick={(e) => {
        e.stopPropagation();
        if (!audio.current) {
          audio.current = new Audio(url);
          audio.current.onended = () => setOn(false);
        }
        if (on) audio.current.pause();
        else void audio.current.play();
        setOn(!on);
      }}
    >
      {on ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <PlayIcon size={12} />
      )}
    </button>
  );
}

// A note as a small paper card: a title, a little of what is inside, and when it was last touched.
export function Card({ note, count = 0 }: { note: Note; count?: number }) {
  const image = note.attachments.find((a) => (a.kind === "image" || a.kind === "sketch") && a.url);
  const parents = note.items.filter((item) => !item.parentId);
  const audio = note.attachments.find((a) => a.kind === "audio");
  const title = note.title || "Untitled";

  return (
    <div className="card-face">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt="" className="card-img" loading="lazy" draggable={false} />
      )}
      <p className="card-title">
        {note.type === "folder" && (
          <span className="card-glyph">
            <FolderGlyph />
          </span>
        )}
        {title}
      </p>

      {note.type === "text" && !image && <p className="card-body">{note.body.replace(/\s+/g, " ").trim() || "No text"}</p>}

      {note.type === "todo" && (
        <ul className="card-list">
          {parents.slice(0, 5).map((item) => (
            <li key={item.id} data-on={item.checked}>
              <span className="card-dot" data-on={item.checked} />
              <span className="card-line">{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {note.type === "audio" && (
        <div className="card-audio">
          <Play url={audio?.url || ""} />
          <Waveform bars={14} />
        </div>
      )}

      {note.type === "file" && (
        <div className="card-file">
          <DocsIcon size={18} />
          <span>{note.attachments[0]?.name || "File"}</span>
        </div>
      )}

      {note.type === "folder" && (
        <p className="card-body">
          {count} {count === 1 ? "note" : "notes"}
        </p>
      )}

      <p className="card-time">{rowTime(note.updatedAt)}</p>
    </div>
  );
}
