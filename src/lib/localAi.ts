import type { Note } from "./types";

export type DeskTask = "title" | "shorten" | "list" | "continue" | "tidy" | "outline" | "explain" | "quiz" | "ask";
export type ModelSize = "fast" | "smarter";
export type EngineName = "chrome" | "ollama" | "browser";

export type ChatTurn = { role: "user" | "assistant"; text: string };

const BLOCK =
  /\b(sex|nude|porn|kill|murder|suicide|drug|drugs|beer|wine|drunk|weapon|gun)\b/i;

const SIZE_KEY = "draftr.desk.size";
const MODELS: Record<ModelSize, string> = {
  fast: "Xenova/LaMini-Flan-T5-77M",
  smarter: "Xenova/LaMini-Flan-T5-248M",
};

const TASKS: Record<Exclude<DeskTask, "ask">, string> = {
  title: "Write a short kind notebook title, under 6 words.",
  shorten: "Rewrite in one or two short kind sentences.",
  list: "Turn this into a checklist. One item per line.",
  continue: "Continue with two useful, kind sentences.",
  tidy: "Fix spelling and make this clearer. Keep the same meaning.",
  outline: "Make a short study outline with 3 to 5 points.",
  explain: "Explain this in simple words a student can use.",
  quiz: "Write 3 short study questions and answers from this note.",
};

type Gen = (prompt: string) => Promise<string>;

let browserGen: Gen | null = null;
let browserKey = "";
let loading: Promise<Gen> | null = null;
let chromeGen: Gen | null = null;
let ollamaName = "";

export function modelSize(): ModelSize {
  try {
    return localStorage.getItem(SIZE_KEY) === "smarter" ? "smarter" : "fast";
  } catch {
    return "fast";
  }
}

export function setModelSize(size: ModelSize) {
  localStorage.setItem(SIZE_KEY, size);
  if (browserKey !== size) {
    browserGen = null;
    loading = null;
  }
}

function clean(text: string) {
  const next = text.replace(/\s+/g, " ").trim().slice(0, 900);
  if (!next || BLOCK.test(next)) return "I can only help with kind school notes.";
  return next;
}

export function searchNotes(query: string, notes: Note[], limit = 4) {
  const words = query.toLowerCase().split(/\W+/).filter((word) => word.length > 2);
  return notes
    .map((note) => {
      const hay = `${note.title} ${note.body} ${note.items.map((item) => item.label).join(" ")}`.toLowerCase();
      const score = words.reduce((sum, word) => sum + (hay.includes(word) ? 1 : 0), 0) + (note.pinned ? 0.2 : 0);
      return { note, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.note);
}

function packNotes(notes: Note[]) {
  return notes
    .slice(0, 4)
    .map((note) => {
      const items = note.items.slice(0, 4).map((item) => item.label).join(", ");
      return `${note.title}: ${(note.body || items).slice(0, 180)}`;
    })
    .join("\n");
}

function buildPrompt(task: DeskTask, text: string, notes: Note[], history: ChatTurn[]) {
  const recent = history.slice(-4).map((turn) => `${turn.role}: ${turn.text}`).join("\n");
  const found = searchNotes(text, notes);
  const context = found.length ? `Notebook matches:\n${packNotes(found)}` : "No saved note matched.";
  const job = task === "ask" ? "Answer from the notebook and the draft. If the notebook does not say, say you are not sure." : TASKS[task];
  return `You help a student with a private notebook. Be kind, clear, and short. Stay on school notes.\n${job}\n${context}\n${recent}\nDraft:\n${text.slice(0, 700)}`;
}

async function chrome(): Promise<Gen | null> {
  if (chromeGen) return chromeGen;
  const AI = (globalThis as { LanguageModel?: { availability: () => Promise<string>; create: (opts?: object) => Promise<{ prompt: (text: string) => Promise<string> }> } }).LanguageModel;
  if (!AI) return null;
  try {
    const availability = await AI.availability();
    if (availability === "unavailable" || availability === "no") return null;
    const session = await AI.create({
      initialPrompts: [{ role: "system", content: "You help a student with a private notebook. Be kind, clear, and short." }],
    });
    chromeGen = async (prompt) => clean(await session.prompt(prompt));
    return chromeGen;
  } catch {
    return null;
  }
}

async function ollama(): Promise<Gen | null> {
  try {
    const tags = await fetch("http://127.0.0.1:11434/api/tags", { signal: AbortSignal.timeout(800) });
    if (!tags.ok) return null;
    const data = (await tags.json()) as { models?: { name: string }[] };
    const names = data.models?.map((model) => model.name) || [];
    ollamaName = names.find((name) => /llama|qwen|gemma|phi|mistral/i.test(name)) || names[0] || "";
    if (!ollamaName) return null;
    return async (prompt) => {
      const res = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaName,
          stream: false,
          messages: [
            { role: "system", content: "You help a student with a private notebook. Be kind, clear, and short." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) throw new Error("local model busy");
      const body = (await res.json()) as { message?: { content?: string } };
      return clean(body.message?.content || "");
    };
  } catch {
    return null;
  }
}

async function browser(onStatus?: (label: string) => void): Promise<Gen> {
  const size = modelSize();
  if (browserGen && browserKey === size) return browserGen;
  if (!loading || browserKey !== size) {
    browserKey = size;
    loading = (async () => {
      const moduleUrl = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod: any = await import(/* webpackIgnore: true */ moduleUrl);
      mod.env.allowLocalModels = false;
      mod.env.useBrowserCache = true;
      const pipe = await mod.pipeline("text2text-generation", MODELS[size], {
        progress_callback: (row: { status?: string; progress?: number; file?: string }) => {
          if (row.status === "progress" && typeof row.progress === "number") {
            onStatus?.(`Saving model on this device ${Math.round(row.progress)}%`);
          } else if (row.status) {
            onStatus?.(`Preparing ${size} model…`);
          }
        },
      });
      browserGen = async (prompt) => {
        const out = await pipe(prompt, { max_new_tokens: size === "smarter" ? 140 : 90, temperature: 0.35, repetition_penalty: 1.15 });
        const text = Array.isArray(out) ? out[0]?.generated_text : out?.generated_text;
        return clean(String(text || ""));
      };
      return browserGen;
    })();
  }
  return loading;
}

export async function runDesk(
  task: DeskTask,
  text: string,
  notes: Note[],
  history: ChatTurn[] = [],
  onStatus?: (label: string) => void,
) {
  const source = text.trim();
  if (source.length < 2 && task !== "ask") throw new Error("Write a little first.");
  const prompt = buildPrompt(task, source || "What is in my notebook today?", notes, history);
  const sources = searchNotes(source || "today", notes).map((note) => note.title);

  onStatus?.("Checking this device…");
  const localChrome = await chrome();
  if (localChrome) return { text: await localChrome(prompt), engine: "chrome" as const, sources, model: "Chrome on-device" };

  const localOllama = await ollama();
  if (localOllama) {
    onStatus?.(`Using ${ollamaName} on this computer…`);
    return { text: await localOllama(prompt), engine: "ollama" as const, sources, model: ollamaName };
  }

  onStatus?.("Loading the notebook model onto this device…");
  const local = await browser(onStatus);
  onStatus?.("Thinking on this device…");
  return { text: await local(prompt), engine: "browser" as const, sources, model: MODELS[modelSize()] };
}
