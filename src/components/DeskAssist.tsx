"use client";

import { useEffect, useRef, useState } from "react";
import { onDesk } from "@/lib/deskBus";
import { modelSize, runDesk, searchNotes, setModelSize, type ChatTurn, type DeskTask, type ModelSize } from "@/lib/localAi";
import { useStore } from "@/lib/store";
import { Segmented } from "./Segmented";
import { Sheet } from "./Sheet";

const ACTIONS: { id: DeskTask; label: string }[] = [
  { id: "ask", label: "Ask notes" },
  { id: "outline", label: "Outline" },
  { id: "explain", label: "Explain" },
  { id: "quiz", label: "Quiz" },
  { id: "tidy", label: "Tidy" },
  { id: "list", label: "List" },
  { id: "title", label: "Title" },
  { id: "shorten", label: "Shorten" },
  { id: "continue", label: "Continue" },
];

const MODELS: { id: ModelSize; label: string }[] = [
  { id: "fast", label: "Fast" },
  { id: "smarter", label: "Smarter" },
];

export function DeskAssist() {
  const { notes } = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [draft, setDraft] = useState("");
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [status, setStatus] = useState("Runs on this device. Notes stay here.");
  const [busy, setBusy] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [size, setSize] = useState<ModelSize>("fast");
  const [apply, setApply] = useState<((text: string) => void) | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const off = onDesk((request) => {
      setDraft(request.text || "");
      setText(request.text || "");
      setChat([]);
      setSources([]);
      setSize(modelSize());
      setApply(() => request.onApply || null);
      setStatus("Runs on this device. Notes stay here.");
      setOpen(true);
    });
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat, status]);

  async function ask(task: DeskTask, prompt = text) {
    const source = prompt.trim() || draft.trim();
    if (!source && task !== "ask") return;
    const userText = task === "ask" ? source || "What is in my notebook today?" : `${task}: ${source.slice(0, 140)}`;
    const nextChat = [...chat, { role: "user" as const, text: userText }];
    setChat(nextChat);
    setText("");
    setBusy(true);
    try {
      const next = await runDesk(task, source || draft, notes, nextChat, setStatus);
      setChat([...nextChat, { role: "assistant", text: next.text }]);
      setSources(next.sources);
      setStatus(`${next.model} · on this device`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not run on this device.");
    } finally {
      setBusy(false);
    }
  }

  const last = [...chat].reverse().find((turn) => turn.role === "assistant");
  const matches = open ? searchNotes(draft || text, notes, 3) : [];

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="Desk"
      full
      action={
        <button type="button" className="nav-btn strong" onClick={() => setOpen(false)}>
          Done
        </button>
      }
    >
      <div className="flex h-full flex-col">
        <Segmented
          items={MODELS}
          value={size}
          onChange={(option) => {
            setSize(option);
            setModelSize(option);
            setStatus(option === "smarter" ? "Smarter model will download on the next ask." : "Fast model selected.");
          }}
        />

        <div ref={scroller} className="selectable mt-4 min-h-32 flex-1 space-y-2.5 overflow-y-auto">
          {chat.length === 0 && (
            <p className="px-1 text-[15px] leading-6 text-[var(--muted)]">
              Ask a question, or pick a tool below. Desk can search your notes, outline, explain and make a short quiz, all on this device.
            </p>
          )}
          {chat.map((turn, index) => (
            <div key={`${turn.role}-${index}`} className={`fade-up flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-[18px] px-3.5 py-2 text-[16px] leading-snug ${
                  turn.role === "user" ? "bg-[var(--tint)] text-white" : "bg-[var(--surface)]"
                }`}
              >
                {turn.text}
              </p>
            </div>
          ))}
        </div>

        {matches.length > 0 && <p className="mt-2 text-[13px] text-[var(--muted)]">Nearby notes: {matches.map((note) => note.title).join(", ")}</p>}
        {sources.length > 0 && <p className="mt-1 text-[13px] text-[var(--muted)]">Used: {sources.join(", ")}</p>}
        <p className="mt-1 text-[13px] text-[var(--muted)]">{busy ? "Thinking…" : status}</p>

        <div className="chips mt-3">
          {ACTIONS.map((action) => (
            <button key={action.id} type="button" className="chip" disabled={busy} onClick={() => ask(action.id)}>
              {action.label}
            </button>
          ))}
        </div>

        {last && apply && (
          <button
            type="button"
            className="btn btn-quiet mt-3 w-full"
            onClick={() => {
              apply(last.text);
              setOpen(false);
            }}
          >
            Use in Note
          </button>
        )}

        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void ask("ask");
          }}
        >
          <input className="field !rounded-full" placeholder="Ask your notebook" enterKeyHint="send" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn btn-sm !min-h-11 flex-none" disabled={busy}>
            Ask
          </button>
        </form>
      </div>
    </Sheet>
  );
}
