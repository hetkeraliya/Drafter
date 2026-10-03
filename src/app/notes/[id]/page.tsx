"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "@/components/Check";
import { Dictation } from "@/components/Dictation";
import { DocsIcon, PinFilledIcon, PinIcon, PlusIcon, ShareIcon, SparkleIcon, TrashIcon, XIcon } from "@/components/Icons";
import { Markup } from "@/components/Markup";
import { Screen } from "@/components/Screen";
import { SketchPad } from "@/components/SketchPad";
import { SwipeRow } from "@/components/SwipeRow";
import { Waveform } from "@/components/Waveform";
import { openDesk } from "@/lib/deskBus";
import { extractLinks } from "@/lib/links";
import { downloadText, noteToText, shareText } from "@/lib/share";
import { newId, useStore } from "@/lib/store";
import { TAGS } from "@/lib/templates";
import { useNav } from "@/lib/useNav";

const isPdf = (name: string, url: string) => /\.pdf($|\?)/i.test(name) || url.startsWith("data:application/pdf");

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNav();
  const { notes, ready, toggleItem, deleteNote, patchNote, pinNote, tagNote, remindNote, addItem, addSubtask, setItemDue, removeItem } = useStore();
  const note = useMemo(() => notes.find((n) => n.id === id), [notes, id]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [draftItem, setDraftItem] = useState("");
  const [subFor, setSubFor] = useState("");
  const [subText, setSubText] = useState("");
  const [markSrc, setMarkSrc] = useState<string | null>(null);
  const [sketchOpen, setSketchOpen] = useState(false);
  const [hint, setHint] = useState("");
  const loadedFor = useRef("");
  const area = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<{ title?: string; body?: string }>({});

  // Load the note into the editor once per note. Later store updates (sync, autosave) never overwrite typing.
  useEffect(() => {
    if (!note || loadedFor.current === note.id) return;
    loadedFor.current = note.id;
    setTitle(note.title);
    setBody(note.body);
  }, [note]);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const p = pending.current;
    pending.current = {};
    if ((p.title !== undefined || p.body !== undefined) && id) patchNote(id, p);
  }, [id, patchNote]);

  const queue = useCallback(
    (patch: { title?: string; body?: string }) => {
      pending.current = { ...pending.current, ...patch };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 350);
    },
    [flush],
  );

  useEffect(() => () => flush(), [flush]);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 180)}px`;
  }, [body, note?.type]);

  if (!ready) return null;
  if (!note) {
    return (
      <Screen back={{ href: "/notes", label: "Notes" }}>
        <div className="fade-up px-6 pt-24 text-center">
          <p className="text-[22px] font-bold tracking-[-0.025em]">Note Not Found</p>
          <p className="mt-1.5 text-[15px] text-[var(--muted)]">It may have been deleted or moved to Trash.</p>
        </div>
      </Screen>
    );
  }

  const current = note;
  const parents = current.items.filter((item) => !item.parentId);
  const images = current.attachments.filter((a) => (a.kind === "image" || a.kind === "sketch") && a.url);
  const links = extractLinks(`${title}\n${body}`);
  const remindValue = current.remindAt ? current.remindAt.slice(0, 16) : "";
  const file = current.attachments.find((a) => a.kind === "file");
  const audio = current.attachments.find((a) => a.kind === "audio");

  function leave() {
    flush();
    nav.back("/notes");
  }

  function applyBody(next: string) {
    setBody(next);
    window.clearTimeout(timer.current);
    pending.current = { ...pending.current, body: next };
    flush();
  }

  return (
    <Screen
      title={title || "Note"}
      back={{ href: "/notes", label: "Notes" }}
      leading={
        <button type="button" className="nav-btn -ml-1 pl-0" onClick={leave} aria-label="Back to Notes">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
          <span>Notes</span>
        </button>
      }
      trailing={
        <>
          <button
            type="button"
            className="nav-btn"
            aria-label="Desk assistant"
            onClick={() => openDesk({ text: `${title}\n${body}`.trim(), onApply: applyBody })}
          >
            <SparkleIcon size={22} />
          </button>
          <button type="button" className="nav-btn" aria-label={current.pinned ? "Unpin note" : "Pin note"} onClick={() => pinNote(current.id)}>
            {current.pinned ? <PinFilledIcon size={20} /> : <PinIcon size={22} />}
          </button>
          <button
            type="button"
            className="nav-btn danger"
            aria-label="Delete note"
            onClick={() => {
              flush();
              deleteNote(current.id);
              nav.back("/notes");
            }}
          >
            <TrashIcon size={22} />
          </button>
        </>
      }
    >
      <input
        className="mt-1 w-full bg-transparent text-[30px] font-bold leading-[1.15] tracking-[-0.03em] outline-none"
        value={title}
        placeholder="Title"
        aria-label="Title"
        enterKeyHint="next"
        onChange={(e) => {
          setTitle(e.target.value);
          queue({ title: e.target.value });
        }}
      />
      {(current.pinned || current.tags?.length) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {current.pinned && (
            <span className="tag !text-[var(--orange)]">
              <PinFilledIcon size={10} />
              <span className="ml-1">Pinned</span>
            </span>
          )}
          {current.tags?.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {current.type === "todo" && (
        <>
          <div className="group mt-5">
            {parents.map((item) => (
              <div key={item.id}>
                <SwipeRow trailing={[{ label: "Delete", icon: <TrashIcon size={20} />, color: "var(--red)", run: () => removeItem(current.id, item.id) }]}>
                  <div className="cell gap-3">
                    <Check checked={item.checked} onToggle={() => toggleItem(current.id, item.id)} label={item.label} />
                    <span className="strike min-w-0 flex-1" data-on={item.checked}>
                      {item.label}
                    </span>
                    <input
                      data-no-swipe
                      type="date"
                      className="w-[7.4rem] bg-transparent text-right text-[15px] text-[var(--muted)] outline-none"
                      value={item.due || ""}
                      onChange={(e) => setItemDue(current.id, item.id, e.target.value)}
                      aria-label={`Due date for ${item.label}`}
                    />
                    <button
                      type="button"
                      data-no-swipe
                      className="grid h-8 w-8 flex-none place-items-center rounded-full text-[var(--tint)]"
                      aria-label={`Add a step to ${item.label}`}
                      onClick={() => {
                        setSubFor(subFor === item.id ? "" : item.id);
                        setSubText("");
                      }}
                    >
                      <PlusIcon size={18} />
                    </button>
                  </div>
                </SwipeRow>
                {current.items
                  .filter((child) => child.parentId === item.id)
                  .map((child) => (
                    <SwipeRow key={child.id} trailing={[{ label: "Delete", icon: <TrashIcon size={20} />, color: "var(--red)", run: () => removeItem(current.id, child.id) }]}>
                      <div className="cell gap-3 !pl-12">
                        <Check small checked={child.checked} onToggle={() => toggleItem(current.id, child.id)} label={child.label} />
                        <span className="strike min-w-0 flex-1 text-[16px]" data-on={child.checked}>
                          {child.label}
                        </span>
                      </div>
                    </SwipeRow>
                  ))}
                {subFor === item.id && (
                  <form
                    className="cell gap-3 !pl-12"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addSubtask(current.id, item.id, subText);
                      setSubText("");
                    }}
                  >
                    <input autoFocus className="field" placeholder="Add a smaller step" value={subText} onChange={(e) => setSubText(e.target.value)} />
                    <button type="submit" className="btn-plain min-h-9 px-1 text-[15px] font-semibold" disabled={!subText.trim()}>
                      Add
                    </button>
                  </form>
                )}
              </div>
            ))}
            <form
              className="cell gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                addItem(current.id, draftItem);
                setDraftItem("");
              }}
            >
              <span className="grid h-6 w-6 flex-none place-items-center text-[var(--tint)]">
                <PlusIcon size={20} />
              </span>
              <input className="field" placeholder="New item" enterKeyHint="done" value={draftItem} onChange={(e) => setDraftItem(e.target.value)} />
              {draftItem.trim() && (
                <button type="submit" className="btn-plain min-h-9 px-1 text-[15px] font-semibold">
                  Add
                </button>
              )}
            </form>
          </div>
          <p className="group-foot">Swipe left on an item to delete it. Tap + to add a smaller step.</p>
        </>
      )}

      {current.type === "text" && (
        <textarea
          ref={area}
          className="mt-3 block w-full resize-none bg-transparent leading-[1.45] outline-none"
          style={{ minHeight: 180 }}
          placeholder="Start writing"
          aria-label="Note text"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            queue({ body: e.target.value });
          }}
        />
      )}

      {(current.type === "text" || current.type === "todo") && (
        <div className="mt-2">
          <Dictation
            onFinal={(text) => {
              const next = body ? `${body} ${text}` : text;
              setBody(next);
              queue({ body: next });
            }}
          />
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="chip !text-[var(--tint)]">
              {link.host}
            </a>
          ))}
        </div>
      )}

      {current.type === "audio" && (
        <div className="group mt-5 px-5 py-5">
          <div className={audio?.url ? "text-[var(--tint)]" : "text-[var(--faint)]"}>
            <Waveform bars={30} live={false} />
          </div>
          {audio?.url ? (
            <audio controls src={audio.url} className="mt-4 w-full" />
          ) : (
            <p className="mt-3 text-[15px] text-[var(--muted)]">No recording on this note.</p>
          )}
        </div>
      )}

      {current.type === "file" && (
        <div className="group mt-5">
          <div className="cell">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[var(--fill)] text-[var(--muted)]">
              <DocsIcon size={24} />
            </span>
            <p className="min-w-0 flex-1 truncate font-medium">{file?.name || "Attached file"}</p>
            {file?.url && (
              <a href={file.url} download={file.name} className="btn btn-sm">
                Open
              </a>
            )}
          </div>
          {file?.url && isPdf(file.name, file.url) && (
            <iframe title="PDF preview" src={file.url} className="h-80 w-full border-t border-[var(--line)]" />
          )}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {images.map((img) => (
            <button key={img.id} type="button" onClick={() => setMarkSrc(img.url)} className="press overflow-hidden rounded-xl" aria-label="Mark up photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="media-in h-40 w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <p className="group-label">Tags</p>
      <div className="chips">
        {TAGS.map((tag) => (
          <button key={tag} type="button" className="chip" aria-pressed={Boolean(current.tags?.includes(tag))} onClick={() => tagNote(current.id, tag)}>
            {tag}
          </button>
        ))}
      </div>

      <div className="group mt-6">
        <label className="cell">
          <span className="flex-1">Remind me</span>
          <input
            type="datetime-local"
            className="bg-transparent text-right text-[15px] text-[var(--muted)] outline-none"
            value={remindValue}
            onChange={(e) => remindNote(current.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
          {remindValue && (
            <button
              type="button"
              className="grid h-7 w-7 flex-none place-items-center text-[var(--muted)]"
              aria-label="Clear reminder"
              onClick={(e) => {
                e.preventDefault();
                remindNote(current.id, null);
              }}
            >
              <XIcon size={16} />
            </button>
          )}
        </label>
        <button type="button" className="cell" onClick={() => setSketchOpen((v) => !v)}>
          <span className="flex-1 text-[var(--tint)]">{sketchOpen ? "Hide sketch pad" : "Add a sketch"}</span>
        </button>
        {sketchOpen && (
          <div className="p-3">
            <SketchPad
              onSave={(url) => {
                flush();
                patchNote(current.id, { attachments: [...current.attachments, { id: newId(), kind: "sketch", url, name: "sketch.png" }] });
                setSketchOpen(false);
              }}
            />
          </div>
        )}
        <button
          type="button"
          className="cell"
          onClick={async () => {
            const result = await shareText(current.title, noteToText(current));
            setHint(result === "shared" ? "Shared" : result === "copied" ? "Copied to clipboard" : "Could not share");
            window.setTimeout(() => setHint(""), 2400);
          }}
        >
          <span className="flex-1 text-[var(--tint)]">Share</span>
          <span className="text-[var(--tint)]">
            <ShareIcon size={20} />
          </span>
        </button>
        <button type="button" className="cell" onClick={() => downloadText(`${current.title || "note"}.txt`, noteToText(current))}>
          <span className="flex-1 text-[var(--tint)]">Download as text</span>
        </button>
      </div>
      {hint && <p className="group-foot fade-up">{hint}</p>}

      {markSrc && (
        <Markup
          src={markSrc}
          onClose={() => setMarkSrc(null)}
          onSave={(url) => {
            patchNote(current.id, { attachments: current.attachments.map((att) => (att.url === markSrc ? { ...att, url } : att)) });
            setMarkSrc(null);
          }}
        />
      )}
    </Screen>
  );
}
