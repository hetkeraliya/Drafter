import type { Note } from "./types";

// Folders are notes with type "folder". A note belongs to a folder through parentId,
// and its place inside that folder comes from position (lowest first).

export function liveIndex(notes: Note[]) {
  const map = new Map<string, Note>();
  for (const note of notes) if (!note.deletedAt) map.set(note.id, note);
  return map;
}

// A note whose folder is missing or in the trash is shown at the top level, so nothing can get lost.
export function effectiveParent(note: Note, index: Map<string, Note>): string | null {
  const parent = note.parentId;
  if (!parent || parent === note.id) return null;
  const folder = index.get(parent);
  return folder && folder.type === "folder" ? parent : null;
}

export function positionOf(note: Note) {
  return typeof note.position === "number" ? note.position : -Date.parse(note.updatedAt) / 1000;
}

export function childrenOf(notes: Note[], parentId: string | null): Note[] {
  const index = liveIndex(notes);
  return [...index.values()]
    .filter((note) => effectiveParent(note, index) === parentId)
    .sort((a, b) => positionOf(a) - positionOf(b) || b.updatedAt.localeCompare(a.updatedAt));
}

export function descendantIds(notes: Note[], id: string, includeDeleted = false): string[] {
  const out: string[] = [];
  const queue = [id];
  const seen = new Set<string>([id]);
  while (queue.length) {
    const current = queue.shift()!;
    for (const note of notes) {
      if (note.parentId !== current || seen.has(note.id)) continue;
      if (!includeDeleted && note.deletedAt) continue;
      seen.add(note.id);
      out.push(note.id);
      queue.push(note.id);
    }
  }
  return out;
}

// Gives every note a numeric position. Notes without one go in front, newest first, so older data keeps its order.
export function ensurePositions(notes: Note[]): Note[] {
  if (notes.every((note) => typeof note.position === "number")) return notes;
  const groups = new Map<string, Note[]>();
  for (const note of notes) {
    const key = note.parentId || "";
    const list = groups.get(key);
    if (list) list.push(note);
    else groups.set(key, [note]);
  }
  const assigned = new Map<string, number>();
  groups.forEach((list) => {
    const positioned = list.filter((note) => typeof note.position === "number").map((note) => note.position as number);
    const loose = list.filter((note) => typeof note.position !== "number").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const base = positioned.length ? Math.min(...positioned) : 0;
    loose.forEach((note, rank) => assigned.set(note.id, base - loose.length + rank));
  });
  return notes.map((note) => (assigned.has(note.id) ? { ...note, position: assigned.get(note.id)! } : note));
}
