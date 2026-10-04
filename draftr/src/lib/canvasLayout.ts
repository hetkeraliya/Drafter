import type { Note } from "./types";

export const CARD_W = 172;
const COLS = 3;
const COL_GAP = 34;
const ROW_GAP = 30;

function seeded(id: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// Each card leans a little, always the same way for the same note.
export function tiltOf(id: string) {
  return Math.round((seeded(id, 7) * 5.2 - 2.6) * 10) / 10;
}

// Cards have a fixed height by kind, so the layout is exact and never overlaps.
export function cardHeight(note: Note) {
  if (note.type === "folder") return 160;
  const hasImage = note.attachments.some((a) => (a.kind === "image" || a.kind === "sketch") && a.url);
  if (hasImage) return 200;
  if (note.type === "audio") return 112;
  if (note.type === "file") return 104;
  if (note.type === "todo") {
    const open = note.items.filter((i) => !i.parentId).length;
    return 92 + Math.min(5, Math.max(1, open)) * 26;
  }
  const lines = Math.min(5, Math.ceil((note.body || "").replace(/\s+/g, " ").trim().length / 22));
  return 96 + lines * 18;
}

export interface Spot {
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
}

export interface Layout {
  spots: Map<string, Spot>;
  fresh: { id: string; x: number; y: number }[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

// Notes already placed keep their spot. New ones are placed once: the first time down the columns,
// later ones above the existing cards, so adding a note never shuffles the rest.
export function layoutCards(notes: Note[]): Layout {
  const step = CARD_W + COL_GAP;
  const placed = notes.filter((n) => typeof n.canvasX === "number" && typeof n.canvasY === "number");
  const loose = notes.filter((n) => !(typeof n.canvasX === "number" && typeof n.canvasY === "number"));

  const top = Array<number>(COLS).fill(0);
  const bottom = Array<number>(COLS).fill(0);
  const seen = Array<boolean>(COLS).fill(false);

  for (const n of placed) {
    const col = Math.max(0, Math.min(COLS - 1, Math.round((n.canvasX as number) / step)));
    const y = n.canvasY as number;
    const h = cardHeight(n);
    top[col] = seen[col] ? Math.min(top[col], y) : y;
    bottom[col] = seen[col] ? Math.max(bottom[col], y + h) : y + h;
    seen[col] = true;
  }

  const spots = new Map<string, Spot>();
  const fresh: { id: string; x: number; y: number }[] = [];

  for (const n of placed) {
    spots.set(n.id, { x: n.canvasX as number, y: n.canvasY as number, w: CARD_W, h: cardHeight(n), rot: tiltOf(n.id) });
  }

  if (placed.length === 0) {
    const stagger = [0, 46, 18];
    stagger.forEach((s, i) => (bottom[i] = s));
    for (const n of loose) {
      const h = cardHeight(n);
      let col = 0;
      for (let i = 1; i < COLS; i++) if (bottom[i] < bottom[col]) col = i;
      const x = col * step + Math.round((seeded(n.id, 1) - 0.5) * 24);
      const y = bottom[col] + Math.round((seeded(n.id, 2) - 0.5) * 12);
      bottom[col] += h + ROW_GAP;
      spots.set(n.id, { x, y, w: CARD_W, h, rot: tiltOf(n.id) });
      fresh.push({ id: n.id, x, y });
    }
  } else {
    for (let i = loose.length - 1; i >= 0; i--) {
      const n = loose[i];
      const h = cardHeight(n);
      let col = 0;
      for (let c = 1; c < COLS; c++) if (top[c] > top[col]) col = c;
      const x = col * step + Math.round((seeded(n.id, 1) - 0.5) * 24);
      const y = top[col] - h - ROW_GAP + Math.round((seeded(n.id, 2) - 0.5) * 12);
      top[col] = y;
      spots.set(n.id, { x, y, w: CARD_W, h, rot: tiltOf(n.id) });
      fresh.push({ id: n.id, x, y });
    }
  }

  let minX = 0;
  let minY = 0;
  let maxX = CARD_W;
  let maxY = 0;
  let first = true;
  spots.forEach((s) => {
    if (first) {
      minX = s.x;
      minY = s.y;
      maxX = s.x + s.w;
      maxY = s.y + s.h;
      first = false;
      return;
    }
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + s.w);
    maxY = Math.max(maxY, s.y + s.h);
  });
  return { spots, fresh, bounds: { minX, minY, maxX, maxY } };
}
