"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dictation } from "@/components/Dictation";
import { Phone } from "@/components/Phone";
import { Recorder } from "@/components/Recorder";
import { Segmented } from "@/components/Segmented";
import { SketchPad } from "@/components/SketchPad";
import { fileToAttachment } from "@/lib/files";
import { withViewTransition } from "@/lib/motion";
import { newId, useStore } from "@/lib/store";
import { LIST_TEMPLATES, TAGS } from "@/lib/templates";
import type { Attachment, Note, NoteType } from "@/lib/types";

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
  const router = useRouter();
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
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
    withViewTransition(() => router.push(`/notes/${note.id}`));
  }

  return (
    <Phone>
      <button type="button" onClick={() => withViewTransition(() => router.push("/notes"))} className="btn-ghost -ml-3">
        Back
      </button>
      <h1 className="mt-6 text-[34px] font-semibold leading-none tracking-[-0.045em]">New note</h1>
      <div className="mt-6">
        <Segmented items={TYPES} value={type} onChange={setType} />
      </div>
      {type === "todo" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {LIST_TEMPLATES.map((item) => (
            <button key={item.id} type="button" className="chip" onClick={() => applyTemplate(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-5 space-y-2.5">
        <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        {type === "text" && (
          <div key="text" className="swap space-y-2">
            <textarea className="field" placeholder="Write here" value={body} onChange={(e) => setBody(e.target.value)} />
            <Dictation
              onFinal={(text) => setBody((prev) => (prev ? `${prev} ${text}` : text))}
            />
          </div>
        )}
        {type === "todo" && (
          <textarea
            key="todo"
            className="field swap"
            placeholder="One item per line"
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
          />
        )}
        {type === "images" && (
          <div key="images" className="swap space-y-2.5">
            <label className="card flex min-h-11 cursor-pointer items-center justify-center px-4 text-sm">
              Choose photos
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
            </label>
            <label className="card flex min-h-11 cursor-pointer items-center justify-center px-4 text-sm">
              Take photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addImages(e.target.files)} />
            </label>
            <button type="button" className="card flex min-h-11 w-full items-center justify-center px-4 text-sm" onClick={() => setSketchOpen((v) => !v)}>
              {sketchOpen ? "Hide sketch pad" : "Draw a sketch"}
            </button>
            {sketchOpen && (
              <SketchPad
                onSave={(url) => {
                  setImages((prev) => [...prev, { id: newId(), kind: "sketch" as const, url, name: "sketch.png" }].slice(0, 8));
                  setSketchOpen(false);
                }}
              />
            )}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt="" className="media-in h-24 w-full rounded-[10px] object-cover" />
                ))}
              </div>
            )}
          </div>
        )}
        {type === "audio" && (
          <div key="audio" className="swap">
            <Recorder value={audio} onChange={setAudio} />
          </div>
        )}
        {type === "file" && (
          <div key="file" className="swap space-y-2.5">
            <label className="card flex min-h-11 cursor-pointer items-center justify-center px-4 text-sm">
              Upload PDF or file
              <input type="file" accept="application/pdf,.pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => addPdf(e.target.files)} />
            </label>
            {fileAtt && <p className="text-sm text-[var(--muted)]">{fileAtt.name}</p>}
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {TAGS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTags((prev) => (prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]))}
              className={`chip ${tags.includes(item) ? "bg-[var(--ink)] text-[#fafafa]" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
        {hint && <p className="text-sm text-[var(--danger)]">{hint}</p>}
        <button type="submit" disabled={!canSave} className="btn w-full">
          Save note
        </button>
      </form>
    </Phone>
  );
}

export default function NewNotePage() {
  return (
    <Suspense fallback={null}>
      <NewNoteForm />
    </Suspense>
  );
}
