import type { Note, NoteType } from "./types";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Apple-Notes style: time today, "Yesterday", weekday this week, otherwise a short date.
export function rowTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

export const TYPE_LABEL: Record<NoteType, string> = {
  text: "Text",
  todo: "To-Do",
  images: "Images",
  audio: "Audio",
  file: "Files",
  folder: "Folders",
};

export interface Section {
  key: string;
  title: string;
  notes: Note[];
}

export function sectionize(list: Note[], sort: "new" | "old" | "type", now = new Date()): Section[] {
  const pinned = list.filter((n) => n.pinned);
  const rest = list.filter((n) => !n.pinned);
  const out: Section[] = [];
  if (pinned.length) out.push({ key: "pinned", title: "Pinned", notes: pinned });
  if (!rest.length) return out;

  if (sort === "old") {
    out.push({ key: "old", title: "Oldest first", notes: rest });
    return out;
  }

  if (sort === "type") {
    (Object.keys(TYPE_LABEL) as NoteType[]).forEach((type) => {
      const group = rest.filter((n) => n.type === type);
      if (group.length) out.push({ key: type, title: TYPE_LABEL[type], notes: group });
    });
    return out;
  }

  const buckets = new Map<string, Section>();
  for (const note of rest) {
    const d = new Date(note.updatedAt);
    const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
    let key: string;
    let title: string;
    if (days <= 0) [key, title] = ["today", "Today"];
    else if (days === 1) [key, title] = ["yesterday", "Yesterday"];
    else if (days < 8) [key, title] = ["week", "Previous 7 Days"];
    else if (days < 31) [key, title] = ["month", "Previous 30 Days"];
    else {
      key = `${d.getFullYear()}-${d.getMonth()}`;
      title = d.toLocaleDateString(undefined, { month: "long", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
    }
    const found = buckets.get(key);
    if (found) found.notes.push(note);
    else buckets.set(key, { key, title, notes: [note] });
  }
  return [...out, ...buckets.values()];
}
