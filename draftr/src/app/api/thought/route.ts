import { NextResponse } from "next/server";
import { isKidSafeQuote, looksLikeApiNotice, shapeCard, shapeQuote } from "@/lib/safeQuote";
import { thoughtForDate, todayKey } from "@/lib/thoughts";

export const dynamic = "force-dynamic";

type Found = { quote: string; author: string; source: string };

async function readJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Draftr/1.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(4500),
  });
  if (!res.ok) throw new Error(`bad ${res.status}`);
  return res.json();
}

function fromZenRow(row: { q?: unknown; a?: unknown }): Found {
  const quote = String(row?.q || "");
  if (looksLikeApiNotice(quote)) throw new Error("zen notice");
  return { quote, author: String(row?.a || ""), source: "ZenQuotes" };
}

async function fromZenToday(): Promise<Found> {
  const data = await readJson("https://zenquotes.io/api/today");
  return fromZenRow(Array.isArray(data) ? data[0] : data);
}

async function fromZenRandom(): Promise<Found> {
  const data = await readJson("https://zenquotes.io/api/random");
  return fromZenRow(Array.isArray(data) ? data[0] : data);
}

async function fromDummy(): Promise<Found> {
  const data = await readJson("https://dummyjson.com/quotes/random");
  return { quote: String(data?.quote || ""), author: String(data?.author || ""), source: "Public quotes" };
}

// Batches: a different random slice every call, so the deck never sees the same set twice.
async function zenBatch(): Promise<Found[]> {
  const data = await readJson("https://zenquotes.io/api/quotes");
  const rows = Array.isArray(data) ? data : [];
  return rows.flatMap((row) => {
    try {
      return [fromZenRow(row)];
    } catch {
      return [];
    }
  });
}

async function dummyBatch(): Promise<Found[]> {
  const skip = Math.floor(Math.random() * 1400);
  const data = await readJson(`https://dummyjson.com/quotes?limit=30&skip=${skip}`);
  const rows = Array.isArray(data?.quotes) ? data.quotes : [];
  return rows.map((row: { quote?: unknown; author?: unknown }) => ({
    quote: String(row.quote || ""),
    author: String(row.author || ""),
    source: "Public quotes",
  }));
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function GET(req: Request) {
  const day = todayKey();
  const { searchParams } = new URL(req.url);
  const count = Math.min(Math.max(Number(searchParams.get("count")) || 0, 0), 30);

  if (count > 0) {
    const results = await Promise.allSettled([zenBatch(), dummyBatch()]);
    const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const seen = new Set<string>();
    const items = [];
    for (const found of shuffle(all)) {
      const key = found.quote.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      if (key.length > 140) continue;
      if (!isKidSafeQuote(`${found.quote} ${found.author}`)) continue;
      seen.add(key);
      items.push(shapeCard(found.quote, found.author, found.source, day));
      if (items.length >= count) break;
    }
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  }

  const tries = [fromZenToday, fromZenRandom, fromDummy];
  for (const trySource of tries) {
    try {
      const found = await trySource();
      if (!isKidSafeQuote(`${found.quote} ${found.author}`)) continue;
      return NextResponse.json(shapeQuote(found.quote, found.author, found.source, day));
    } catch {
      /* try next source */
    }
  }

  return NextResponse.json({ ...thoughtForDate(), live: false, source: "Draftr" });
}
