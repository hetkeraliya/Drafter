import { NextResponse } from "next/server";
import { isKidSafeQuote, shapeQuote } from "@/lib/safeQuote";
import { thoughtForDate, todayKey } from "@/lib/thoughts";

export const dynamic = "force-dynamic";

type Found = { quote: string; author: string; source: string };

async function readJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Draftr/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`bad ${res.status}`);
  return res.json();
}

async function fromZenToday(): Promise<Found> {
  const data = await readJson("https://zenquotes.io/api/today");
  const row = Array.isArray(data) ? data[0] : data;
  return { quote: String(row?.q || ""), author: String(row?.a || ""), source: "ZenQuotes" };
}

async function fromZenRandom(): Promise<Found> {
  const data = await readJson("https://zenquotes.io/api/random");
  const row = Array.isArray(data) ? data[0] : data;
  return { quote: String(row?.q || ""), author: String(row?.a || ""), source: "ZenQuotes" };
}

async function fromDummy(): Promise<Found> {
  const data = await readJson("https://dummyjson.com/quotes/random");
  return { quote: String(data?.quote || ""), author: String(data?.author || ""), source: "Public quotes" };
}

export async function GET() {
  const day = todayKey();
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
