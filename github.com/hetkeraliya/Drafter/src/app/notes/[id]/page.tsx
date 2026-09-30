"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Dictation } from "@/components/Dictation";
import { Markup } from "@/components/Markup";
import { Phone } from "@/components/Phone";
import { SketchPad } from "@/components/SketchPad";
import { Waveform } from "@/components/Waveform";
import { openDesk } from "@/lib/deskBus";
import { extractLinks } from "@/lib/links";
import { withViewTransition } from "@/lib/motion";
import { downloadText, noteToText, shareText } from "@/lib/share";
import { newId, useStore } from "@/lib/store";
import { TAGS } from "@/lib/templates";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    notes,
    toggleItem,
    deleteNote,
    upsertNote,
    ready,
    pinNote,
    tagNote,
    remindNote,
    addItem,
    addSubtask,
    setItemDue,
    removeItem,
  } = useStore();
  const note = useMemo(() => notes.find((n) => n.id === id), [notes, id]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [draftItem, setDraftItem] = useState("");
  const [markSrc, setMarkSrc] = useState<string | null>(null);
  const [sketchOpen, setSketchOpen] = useState(false);
  const [shareHint, setShareHint] = useState("");
  const links = extractLinks(`${title}\n${body}`);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
    }
  }, [note]);

  if (!ready) return null;
  if (!note) {
    return (
      <Phone>
        <p className="text-sm">Note not found.</p>
        <button type="button" onClick={() => withViewTransition(() => router.push("/notes"))} className="btn-ghost mt-2 -ml-3">
          Back
        </button>
      </Phone>
    );
  }

  const parents = note.items.filter((item) => !item.parentId);
  const remindValue = note.remindAt ? note.remindAt.slice(0, 16) : "";

  return (
    <Phone>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => withViewTransition(() => router.push("/notes"))} className="btn-ghost -ml-3">
          Back
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              openDesk({
                text: `${title}\n${body}`.trim(),
                onApply: (next) => {
                  setBody(next);
                  upsertNote({ ...note, body: next, updatedAt: new Date().toISOString() });
                },
              })
            }
            className="btn-ghost"
          >
            Desk
          </button>
          <button type="button" onClick={() => pinNote(note.id)} className="btn-ghost">
            {note.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            onClick={() => {
              deleteNote(note.id);
              withViewTransition(() => router.push("/notes"));
            }}
            className="btn-ghost text-[var(--danger)]"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="chip">{note.type}</span>
        {note.pinned && <span className="chip">pinned</span>}
        {note.tags?.map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
      </div>
      <input
        className="mt-3 w-full bg-transparent text-[32px] font-semibold leading-[1.1] tracking-[-0.045em] outline-none"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          upsertNote({ ...note, title: e.target.value, updatedAt: new Date().toISOString() });
        }}
      />

      {note.type === "todo" && (
        <div className="mt-6 space-y-2">
          <ul className="space-y-1">
            {parents.map((item, i) => (
              <li key={item.id} className="space-y-1">
                <div className="card row flex items-center gap-2 px-3" style={{ ["--i" as string]: i }}>
                  <button type="button" onClick={() => toggleItem(note.id, item.id)} className="flex min-h-12 flex-1 items-center gap-3 text-left">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-[5px] border text-xs ${
                        item.checked ? "check-pop border-[var(--accent)] bg-[var(--accent)] text-white" : "border-current"
                      }`}
                    >
                      {item.checked ? "✓" : ""}
                    </span>
                    <span className={item.checked ? "text-[var(--muted)] line-through" : ""}>{item.label}</span>
                  </button>
                  <input
                    type="date"
                    className="w-[8.5rem] bg-transparent text-[11px] text-[var(--muted)] outline-none"
                    value={item.due || ""}
                    onChange={(e) => setItemDue(note.id, item.id, e.target.value)}
                    aria-label={`Due date for ${item.label}`}
                  />
                  <button type="button" className="btn-ghost px-2 text-xs" onClick={() => removeItem(note.id, item.id)}>
                    ×
                  </button>
                </div>
                <ul className="ml-6 space-y-1">
                  {note.items
                    .filter((child) => child.parentId === item.id)
                    .map((child) => (
                      <li key={child.id} className="card flex items-center gap-2 px-3">
                        <button type="button" onClick={() => toggleItem(note.id, child.id)} className="flex min-h-10 flex-1 items-center gap-3 text-left text-sm">
                          <span
                            className={`grid h-4 w-4 place-items-center rounded-[4px] border text-[10px] ${
                              child.checked ? "check-pop border-[var(--accent)] bg-[var(--accent)] text-white" : "border-current"
                            }`}
                          >
                            {child.checked ? "✓" : ""}
                          </span>
                          <span className={child.checked ? "text-[var(--muted)] line-through" : ""}>{child.label}</span>
                        </button>
                        <button type="button" className="btn-ghost px-2 text-xs" onClick={() => removeItem(note.id, child.id)}>
                          ×
                        </button>
                      </li>
                    ))}
                  <li>
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const input = form.elements.namedItem("sub") as HTMLInputElement;
                        addSubtask(note.id, item.id, input.value);
                        input.value = "";
                      }}
                    >
                      <input name="sub" className="field min-h-10 text-sm" placeholder="Add a smaller step" />
                      <button type="submit" className="btn-ghost text-xs">
                        Add
                      </button>
                    </form>
                  </li>
                </ul>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addItem(note.id, draftItem);
              setDraftItem("");
            }}
          >
            <input className="field" placeholder="Add a list item" value={draftItem} onChange={(e) => setDraftItem(e.target.value)} />
            <button type="submit" className="btn min-h-11 px-4">
              Add
            </button>
          </form>
        </div>
      )}

      {(note.type === "text" || note.type === "todo") && (
        <div className="mt-5 space-y-2">
          {note.type === "text" && (
            <textarea
              className="min-h-56 w-full bg-transparent leading-7 text-[var(--ink)] outline-none"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                upsertNote({ ...note, body: e.target.value, updatedAt: new Date().toISOString() });
              }}
            />
          )}
          <Dictation
            onFinal={(text) => {
              const next = body ? `${body} ${text}` : text;
              setBody(next);
              upsertNote({ ...note, body: next, updatedAt: new Date().toISOString() });
            }}
          />
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="chip">
              {link.host}
            </a>
          ))}
        </div>
      )}

      {note.type === "audio" && (
        <div className="card mt-8 space-y-3 p-4">
          <Waveform live={Boolean(note.attachments[0]?.url)} />
          {note.attachments[0]?.url ? (
            <audio controls src={note.attachments[0].url} className="w-full" />
          ) : (
            <p className="text-sm text-[var(--muted)]">No recording on this card.</p>
          )}
        </div>
      )}

      {note.type === "file" && (
        <div className="card mt-8 space-y-3 p-4 text-sm">
          <p>{note.attachments[0]?.name || "Attached file"}</p>
          {note.attachments[0]?.url && (
            <>
              <a href={note.attachments[0].url} download={note.attachments[0].name} className="btn w-fit">
                Open file
              </a>
              {/\.pdf($|\?)/i.test(note.attachments[0].name) || note.attachments[0].url.startsWith("data:application/pdf") ? (
                <iframe title="PDF preview" src={note.attachments[0].url} className="mt-2 h-72 w-full rounded-[12px] border border-[var(--line)]" />
              ) : null}
            </>
          )}
        </div>
      )}

      {note.attachments.filter((a) => a.kind === "image" || a.kind === "sketch").length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {note.attachments
            .filter((a) => a.kind === "image" || a.kind === "sketch")
            .map((img) => (
              <button key={img.id} type="button" onClick={() => setMarkSrc(img.url)} className="overflow-hidden rounded-[12px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="media-in h-40 w-full object-cover" />
              </button>
            ))}
        </div>
      )}

      <button type="button" className="btn-ghost mt-4 -ml-3" onClick={() => setSketchOpen((v) => !v)}>
        {sketchOpen ? "Hide sketch pad" : "Add a sketch"}
      </button>
      {sketchOpen && (
        <SketchPad
          onSave={(url) => {
            upsertNote({
              ...note,
              attachments: [...note.attachments, { id: newId(), kind: "sketch", url, name: "sketch.png" }],
              updatedAt: new Date().toISOString(),
            });
            setSketchOpen(false);
          }}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => tagNote(note.id, tag)}
            className={`chip ${note.tags?.includes(tag) ? "bg-[var(--ink)] text-[#fafafa]" : ""}`}
          >
            {tag}
          </button>
        ))}
      </div>

      <label className="mt-5 block text-sm text-[var(--muted)]">
        Reminder
        <input
          type="datetime-local"
          className="field mt-2"
          value={remindValue}
          onChange={(e) => remindNote(note.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn"
          onClick={async () => {
            const result = await shareText(note.title, noteToText(note));
            setShareHint(result === "shared" ? "Shared" : result === "copied" ? "Copied" : "Could not share");
          }}
        >
          Share
        </button>
        <button type="button" className="btn-ghost" onClick={() => downloadText(`${note.title || "note"}.txt`, noteToText(note))}>
          Download text
        </button>
      </div>
      {shareHint && <p className="mt-2 text-sm text-[var(--muted)]">{shareHint}</p>}

      {markSrc && (
        <Markup
          src={markSrc}
          onClose={() => setMarkSrc(null)}
          onSave={(url) => {
            upsertNote({
              ...note,
              attachments: note.attachments.map((att) => (att.url === markSrc ? { ...att, url } : att)),
              updatedAt: new Date().toISOString(),
            });
            setMarkSrc(null);
          }}
        />
      )}
    </Phone>
  );
}
