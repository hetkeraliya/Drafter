import type { DailyThought } from "./types";

const DAYS: Omit<DailyThought, "day">[] = [
  {
    headline: "Start small. Finish kind.",
    body: "A quiet page is enough. Write one true line, then another, and let the day follow.",
    prompt: "What is one small thing you can finish today?",
  },
  {
    headline: "Clear desk, clear head.",
    body: "Put the next task on paper. The rest can wait in a list that does not shout.",
    prompt: "What can leave your mind and live on a list?",
  },
  {
    headline: "Try again, gently.",
    body: "A missed check box is not a failed day. Open the note and take the next box.",
    prompt: "Which unfinished line still matters?",
  },
  {
    headline: "Notice something kind.",
    body: "Look once around the room. Keep the detail that made the hour softer.",
    prompt: "What did you notice that was quietly good?",
  },
  {
    headline: "One page is a win.",
    body: "You do not need a perfect journal. You need a place that keeps the thought.",
    prompt: "Write the sentence you keep repeating in your head.",
  },
  {
    headline: "Ask a better question.",
    body: "Instead of “am I done?”, try “what is the next kind step?”",
    prompt: "What is the next kind step?",
  },
  {
    headline: "Leave room to breathe.",
    body: "A blank margin is part of the note. You do not have to fill every line.",
    prompt: "What can you put down for later?",
  },
  {
    headline: "Learn one small thing.",
    body: "A page does not have to hold the whole subject. Keep the part you can use today.",
    prompt: "What did you learn that you can say in one line?",
  },
  {
    headline: "Be fair to tomorrow.",
    body: "Finish the line you started. Leave the rest where you can find it.",
    prompt: "What should tomorrow-you see first?",
  },
  {
    headline: "Look up once.",
    body: "The next idea is often already in the room. Write the detail before it leaves.",
    prompt: "What is in front of you right now?",
  },
  {
    headline: "Kind work counts.",
    body: "Helping, tidying, and trying again are real work. Put them on the page.",
    prompt: "What kind thing did you do today?",
  },
  {
    headline: "Make a margin.",
    body: "A thought needs space around it. Write it, then leave a quiet line under it.",
    prompt: "Which sentence needs more room?",
  },
  {
    headline: "Ask, then answer.",
    body: "A good note can be a question you are willing to sit with.",
    prompt: "What question are you carrying?",
  },
];

export function gradientFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) % 360;
  const a = hash;
  const b = (hash + 36) % 360;
  const c = (hash + 78) % 360;
  return `radial-gradient(120% 80% at 15% 10%, hsl(${b} 62% 62% / 0.85), transparent 55%), linear-gradient(165deg, hsl(${a} 42% 22%), hsl(${b} 46% 38%) 48%, hsl(${c} 38% 16%))`;
}

export function thoughtForDate(date = new Date()): DailyThought {
  const day = date.toISOString().slice(0, 10);
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const index = Math.floor((date.getTime() - start) / 86400000) % DAYS.length;
  return { day, ...DAYS[index] };
}

export function thoughtAt(index: number, date = new Date()): DailyThought {
  const day = date.toISOString().slice(0, 10);
  const safe = ((index % DAYS.length) + DAYS.length) % DAYS.length;
  return { day, ...DAYS[safe] };
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function thoughtCount() {
  return DAYS.length;
}
