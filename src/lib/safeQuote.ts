const BLOCK =
  /\b(sex|sexy|nude|porn|kill|murder|suicide|hate|drunk|beer|wine|whiskey|cigarette|drug|drugs|hell|damn|slave|racist|violence|gun|blood|war)\b/i;

const PROMPTS = [
  "What does this spark for you today?",
  "Where does this show up in your day?",
  "Write one line that this reminds you of.",
  "What would you do differently after reading this?",
  "Who needs to hear this today?",
  "What is one small step this points to?",
  "Do you agree? Write why or why not.",
  "Which part of this sticks with you?",
  "How would you say this in your own words?",
  "What is a moment from this week this fits?",
];

export function isKidSafeQuote(text: string) {
  const clean = text.trim();
  if (clean.length < 12 || clean.length > 280) return false;
  if (BLOCK.test(clean)) return false;
  return true;
}

// Rate-limit and error messages from public quote APIs come back as 200 "quotes".
export function looksLikeApiNotice(text: string) {
  return /too many requests|rate limit|zenquotes\.io|obtain an auth key/i.test(text);
}

export function randomPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export function shapeQuote(quote: string, author: string, source: string, day: string) {
  const text = quote.replace(/\s+/g, " ").trim().replace(/^["“]+|["”]+$/g, "");
  const who = author.replace(/\s+/g, " ").trim() || "Unknown";
  const short = text.length > 42 ? `${text.slice(0, 42).replace(/\s+\S*$/, "")}…` : text;
  return {
    day,
    headline: short,
    body: who ? `${text} (${who})` : text,
    prompt: "What does this spark for you today?",
    author: who,
    source,
    live: true,
  };
}

// Card form: the whole quote is the headline, the author sits underneath.
export function shapeCard(quote: string, author: string, source: string, day: string) {
  const text = quote.replace(/\s+/g, " ").trim().replace(/^["“]+|["”]+$/g, "");
  const who = author.replace(/\s+/g, " ").trim() || "Unknown";
  return {
    day,
    headline: text,
    body: who,
    prompt: randomPrompt(),
    author: who,
    source,
    live: true,
  };
}
