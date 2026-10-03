"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dictation } from "@/components/Dictation";
import { CameraIcon, DocsIcon, PhotoIcon, PenIcon } from "@/components/Icons";
import { Recorder } from "@/components/Recorder";
import { Screen } from "@/components/Screen";
import { Segmented } from "@/components/Segmented";
import { SketchPad } from "@/components/SketchPad";
import { fileToAttachment } from "@/lib/files";
import { newId, useStore } from "@/lib/store";
import { LIST_TEMPLATES, TAGS } from "@/lib/templates";
import type { Attachment, Note, NoteType } from "@/lib/types";
import { useNav } from "@/lib/useNav";

const TYPES: { id: NoteType; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "todo", label: "To-Do" },
  { id: "images", label: "Images" },
  { id: "audio", label: "Audio" },
  { id: "file", label: "Files" },
];

function NewNoteForm() {
  const params = useSearchParams();
  const initial = (params.get("type") as NoteType) || "text";
  const [type, setType] = useState<NoteType>(TYPES.some((t) => t.id === initial) ? initial : "text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [images, setImages] = useState<Attachment[]>([]);
  const [audio, setAudio] = useState<{ url: string; name: string } | null>(null);
  const [fileAtt, setFileAtt] = useState<Attachment | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [sketchOpen, setSketchOpen] = useState(false);
  const { upsertNote } = useStore();
  const nav = useNav();
  const canSave = useMemo(() => title.trim().length > 0, [title]);

  async function addImages(list: FileList | null) {
    if (!list?.length) return;
    setHint("");
    try {
      const next: Attachment[] = [];
      for (const file of Array.from(list)) {
        const packed = await fileToAttachment(file, "image");
        next.push({ id: newId(), kind: "image", url: packed.url, name: packed.name });
      }
      setImages((prev) => [...prev, ...next].slice(0, 8));
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Could not add that photo.");
    }
  }

  async function addPdf(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setHint("");
    try {
      const packed = await fileToAttachment(file, "file");
      setFileAtt({ id: newId(), kind: "file", url: packed.url, name: packed.name });
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Could not add that file.");
    }
  }

  function applyTemplate(id: string) {
    const found = LIST_TEMPLATES.find((item) => item.id === id);
    if (!found) return;
    setTitle(found.label);
    setItemsText(found.items.join("\n"));
    setType("todo");
  }

  function save() {
    if (!canSave) return;
    const now = new Date().toISOString();
    const attachments =
      type === "images" || images.some((img) => img.kind === "sketch")
        ? images
        : type === "audio" && audio
          ? [{ id: newId(), kind: "audio" as const, url: audio.url, name: audio.name }]
          : type === "file" && fileAtt
            ? [fileAtt]
            : images;
    const note: Note = {
      id: newId(),
      title: title.trim(),
      body: body.trim(),
      type,
      tint: type === "todo" ? "mint" : type === "audio" ? "lilac" : type === "file" ? "sand" : type === "images" ? "sky" : "cream",
      items:
        type === "todo"
          ? itemsText
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .map((label) => ({ id: newId(), label, checked: false }))
          : [],
      attachments,
      createdAt: now,
      updatedAt: now,
      tags,
    };
    upsertNote(note);
    nav.go(`/notes/${note.id}`, "down");
  }

  return (
    <Screen
      title="New Note"
      leading={
        <button type="button" className="nav-btn" onClick={() => nav.go("/notes", "down")}>
          Cancel
        </button>
      }
      trailing={
        <button type="button" className="nav-btn strong" disabled={!canSave} onClick={save}>
          Save
        </button>
      }
    >
      <Segmented items={TYPES} value={type} onChange={setType} />

      {type === "todo" && (
        <div className="chips mt-3">
          {LIST_TEMPLATES.map((item) => (
            <button key={item.id} type="button" className="chip" onClick={() => applyTemplate(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="group mt-5">
        <input
          className="field !text-[20px] !font-semibold"
          placeholder="Title"
          aria-label="Title"
          enterKeyHint="next"
          autoFocus={type === "text"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {type === "text" && (
        <div className="fade-up mt-3">
          <div className="group">
            <textarea className="field" placeholder="Start writing" aria-label="Note text" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="mt-3">
            <Dictation onFinal={(text) => setBody((prev) => (prev ? `${prev} ${text}` : text))} />
          </div>
        </div>
      )}

      {type === "todo" && (
        <div className="fade-up mt-3">
          <div className="group">
            <textarea className="field" placeholder="One item per line" aria-label="List items" value={itemsText} onChange={(e) => setItemsText(e.target.value)} />
          </div>
        </div>
      )}

      {type === "images" && (
        <div className="fade-up mt-3">
          <div className="group">
            <label className="cell tappable">
              <span className="cell-icon" style={{ background: "var(--tint)" }}>
                <PhotoIcon size={18} />
              </span>
              <span className="flex-1">Choose Photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
            </label>
            <label className="cell tappable">
              <span className="cell-icon" style={{ background: "var(--green)" }}>
                <CameraIcon size={18} />
              </span>
              <span className="flex-1">Take Photo</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addImages(e.target.files)} />
            </label>
            <button type="button" className="cell" onClick={() => setSketchOpen((v) => !v)}>
              <span className="cell-icon" style={{ background: "var(--orange)" }}>
                <PenIcon size={18} />
              </span>
              <span className="flex-1">{sketchOpen ? "Hide Sketch Pad" : "Draw a Sketch"}</span>
            </button>
          </div>
          {sketchOpen && (
            <div className="group mt-3 p-3">
              <SketchPad
                onSave={(url) => {
                  setImages((prev) => [...prev, { id: newId(), kind: "sketch" as const, url, name: "sketch.png" }].slice(0, 8));
                  setSketchOpen(false);
                }}
              />
            </div>
          )}
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt="" className="media-in aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>
      )}

      {type === "audio" && (
        <div className="fade-up mt-3">
          <Recorder value={audio} onChange={setAudio} />
        </div>
      )}

      {type === "file" && (
        <div className="fade-up mt-3">
          <div className="group">
            <label className="cell tappable">
              <span className="cell-icon" style={{ background: "var(--orange)" }}>
                <DocsIcon size={18} />
              </span>
              <span className="flex-1">{fileAtt ? fileAtt.name : "Choose PDF or File"}</span>
              <input type="file" accept="application/pdf,.pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => addPdf(e.target.files)} />
            </label>
          </div>
        </div>
      )}

      <p className="group-label">Tags</p>
      <div className="chips">
        {TAGS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={tags.includes(item)}
            className="chip"
            onClick={() => setTags((prev) => (prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]))}
          >
            {item}
          </button>
        ))}
      </div>

      {hint && <p className="group-foot !text-[var(--red)]">{hint}</p>}
    </Screen>
  );
}

export default function NewNotePage() {
  return (
    <Suspense fallback={null}>
      <NewNoteForm />
    </Suspense>
  );
}
