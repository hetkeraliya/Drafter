const BLOCK =
  /\b(sex|sexy|nude|porn|kill|murder|suicide|hate|drunk|beer|wine|whiskey|cigarette|drug|drugs|hell|damn|slave|racist|violence|gun|blood|war)\b/i;

export function isKidSafeQuote(text: string) {
  const clean = text.trim();
  if (clean.length < 12 || clean.length > 280) return false;
  if (BLOCK.test(clean)) return false;
  return true;
}

export function shapeQuote(quote: string, author: string, source: string, day: string) {
  const text = quote.replace(/\s+/g, " ").trim().replace(/^["“]+|["”]+$/g, "");
  const who = author.replace(/\s+/g, " ").trim() || "Unknown";
  const short = text.length > 42 ? `${text.slice(0, 42).replace(/\s+\S*$/, "")}…` : text;
  return {
    day,
    headline: short,
    body: who ? `${text} — ${who}` : text,
    prompt: "What does this spark for you today?",
    author: who,
    source,
    live: true,
  };
}
