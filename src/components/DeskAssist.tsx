"use client";

import { useEffect, useRef, useState } from "react";
import { onDesk } from "@/lib/deskBus";
import { modelSize, runDesk, searchNotes, setModelSize, type ChatTurn, type DeskTask, type ModelSize } from "@/lib/localAi";
import { useStore } from "@/lib/store";

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

  if (!open) return null;
  const last = [...chat].reverse().find((turn) => turn.role === "assistant");
  const matches = searchNotes(draft || text, notes, 3);

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-[var(--ink)]/30 p-3 sm:place-items-center">
      <div className="card flex max-h-[88dvh] w-full max-w-xl flex-col p-4" role="dialog" aria-label="Desk assistant">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="meta">On this device</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Desk assistant</h2>
          </div>
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {(["fast", "smarter"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`chip ${size === option ? "bg-[var(--ink)] text-[#fafafa]" : ""}`}
              onClick={() => {
                setSize(option);
                setModelSize(option);
                setStatus(option === "smarter" ? "Smarter model will download on the next ask." : "Fast model selected.");
              }}
            >
              {option === "fast" ? "Fast model" : "Smarter model"}
            </button>
          ))}
        </div>

        <div ref={scroller} className="mt-3 min-h-32 flex-1 space-y-2 overflow-auto">
          {chat.length === 0 && (
            <p className="text-sm leading-6 text-[var(--muted)]">
              Ask a question, or use a tool. It can search saved notes on this device, outline, explain, and make a short quiz.
            </p>
          )}
          {chat.map((turn, index) => (
            <p key={`${turn.role}-${index}`} className={`rounded-[12px] px-3 py-2 text-sm leading-6 ${turn.role === "user" ? "bg-[var(--soft)]" : "border border-[var(--line)]"}`}>
              {turn.text}
            </p>
          ))}
        </div>

        {matches.length > 0 && (
          <p className="mt-2 text-[11px] text-[var(--muted)]">Nearby notes: {matches.map((note) => note.title).join(" · ")}</p>
        )}
        {sources.length > 0 && <p className="mt-1 text-[11px] text-[var(--muted)]">Used: {sources.join(" · ")}</p>}
        <p className="mt-2 text-[12px] text-[var(--muted)]">{status}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button key={action.id} type="button" className="chip" disabled={busy} onClick={() => ask(action.id)}>
              {action.label}
            </button>
          ))}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void ask("ask");
          }}
        >
          <input className="field" placeholder="Ask your notebook" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn" disabled={busy}>
            Ask
          </button>
        </form>
        {last && apply && (
          <button
            type="button"
            className="btn mt-3"
            onClick={() => {
              apply(last.text);
              setOpen(false);
            }}
          >
            Use in note
          </button>
        )}
      </div>
    </div>
  );
}
