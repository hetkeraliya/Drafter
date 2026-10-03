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
  {
    headline: "Write the messy version.",
    body: "A rough page can be fixed. A blank page cannot. Start ugly and tidy up after.",
    prompt: "What would you write if nobody read it?",
  },
  {
    headline: "Small steps still move.",
    body: "Ten quiet minutes today beat a perfect plan you never open.",
    prompt: "What can you do in ten minutes?",
  },
  {
    headline: "Name the worry.",
    body: "A worry written down is smaller than a worry carried around.",
    prompt: "What is taking up space in your head?",
  },
  {
    headline: "Save the good ones.",
    body: "Some ideas arrive once. Catch the line before it walks away.",
    prompt: "Which idea almost slipped past you today?",
  },
  {
    headline: "Rest is part of the work.",
    body: "A pause is not a gap in your effort. It is where the next idea gets made.",
    prompt: "What would a proper break look like today?",
  },
  {
    headline: "Be a beginner on purpose.",
    body: "Ask the plain question. Everyone in the room was waiting for someone to.",
    prompt: "What are you afraid to ask?",
  },
  {
    headline: "Finish one thing.",
    body: "One closed loop gives more calm than ten open ones.",
    prompt: "Which task is closest to done?",
  },
  {
    headline: "Notice your wins.",
    body: "You did more than you gave yourself credit for. Write it down so it stays true.",
    prompt: "What went right this week?",
  },
  {
    headline: "Say it simply.",
    body: "If you can write it in one clear line, you understand it.",
    prompt: "What is the one-line version of what you are working on?",
  },
  {
    headline: "Change the view.",
    body: "Move to another chair, another room, another page. Thoughts shift when you do.",
    prompt: "Where could you think differently today?",
  },
  {
    headline: "Keep a quiet list.",
    body: "Things to try, places to see, people to call. A list like this is a gentle kind of hope.",
    prompt: "What is on your someday list?",
  },
  {
    headline: "Thank someone.",
    body: "A two-line thank-you takes a minute and can carry for a week.",
    prompt: "Who helped you lately?",
  },
  {
    headline: "Let it be unfinished.",
    body: "Not every note needs an ending. Some are just a place to rest an idea.",
    prompt: "Which draft are you allowed to leave open?",
  },
  {
    headline: "Start before ready.",
    body: "Readiness shows up after you begin, not before.",
    prompt: "What are you waiting to feel ready for?",
  },
  {
    headline: "Look back, then forward.",
    body: "Read one old note. Then write one line for the person who will read this next year.",
    prompt: "What do you want future-you to remember?",
  },
  {
    headline: "Choose the next right step.",
    body: "You do not need the whole staircase. Only the next stair.",
    prompt: "What is the next stair?",
  },
  {
    headline: "Protect your focus.",
    body: "One tab, one note, one task. The rest can wait ten minutes.",
    prompt: "What can you close right now?",
  },
  {
    headline: "Make it easy to begin.",
    body: "Put the pen where you will see it. Open the note before you need it.",
    prompt: "What would make starting easier tomorrow?",
  },
  {
    headline: "Ask what you are learning.",
    body: "A hard day still teaches something. Catch the lesson, leave the mood.",
    prompt: "What did today teach you?",
  },
  {
    headline: "Be kind in your notes.",
    body: "Write to yourself the way you would write to a friend who is trying.",
    prompt: "What would you tell a friend in your spot?",
  },
  {
    headline: "Slow is smooth.",
    body: "Careful pages age better than rushed ones. Take the extra breath.",
    prompt: "Where could you slow down a little?",
  },
  {
    headline: "Collect small joys.",
    body: "Warm tea, a good song, a clean desk. Write three down before the day ends.",
    prompt: "What are three small good things today?",
  },
  {
    headline: "Try the other way.",
    body: "When one approach stalls, change the question, not your effort.",
    prompt: "What is another way to look at it?",
  },
  {
    headline: "Plan the first hour.",
    body: "Tomorrow gets easier when its first hour is already decided.",
    prompt: "What will you do first tomorrow?",
  },
  {
    headline: "Keep what matters.",
    body: "Not everything needs saving. Keep the line that made you pause.",
    prompt: "Which line deserves a place on your desk?",
  },
  {
    headline: "Let curiosity lead.",
    body: "Follow the odd question for five minutes. Some of your best notes start there.",
    prompt: "What are you curious about right now?",
  },
  {
    headline: "Begin again.",
    body: "A new page is allowed any time of day, not only on Mondays.",
    prompt: "What are you ready to restart?",
  },
];

export function gradientFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) % 360;
  const x = 15 + (hash % 70);
  const y = 10 + ((hash * 7) % 60);
  return `radial-gradient(70% 55% at ${x}% ${y}%, rgba(255,255,255,0.3), transparent 70%), linear-gradient(${120 + (hash % 100)}deg, #000000, #181818 60%, #050505)`;
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

// Every curated thought, for the swipe deck's no-repeat shuffle.
export function thoughtPool(date = new Date()): DailyThought[] {
  const day = date.toISOString().slice(0, 10);
  return DAYS.map((item) => ({ day, ...item }));
}
