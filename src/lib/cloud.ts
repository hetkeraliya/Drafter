import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attachment, ChecklistItem, Note, NoteType, Tint } from "./types";

const TABLE = "draftr_notes";
const MAX_ATTACHMENT_JSON = 1_500_000;

interface Row {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  tint: string | null;
  pinned: boolean | null;
  tags: string[] | null;
  items: ChecklistItem[] | null;
  attachments: Attachment[] | null;
  remind_at: string | null;
  deleted_at: string | null;
  parent_id: string | null;
  position: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export function rowToNote(row: Row): Note {
  const now = new Date().toISOString();
  return {
    id: row.id,
    title: row.title || "",
    body: row.body || "",
    type: (row.type || "text") as NoteType,
    tint: (row.tint || "sky") as Tint,
    pinned: Boolean(row.pinned),
    tags: row.tags || [],
    items: row.items || [],
    attachments: row.attachments || [],
    remindAt: row.remind_at,
    deletedAt: row.deleted_at,
    parentId: row.parent_id,
    position: row.position,
    createdAt: row.created_at || now,
    updatedAt: row.updated_at || now,
  };
}

function noteToRow(note: Note, userId: string) {
  // Very large inline media would blow the request size, so keep those on this device only.
  const attachments =
    JSON.stringify(note.attachments || []).length > MAX_ATTACHMENT_JSON ? [] : note.attachments || [];
  return {
    user_id: userId,
    id: note.id,
    title: note.title || "",
    body: note.body || "",
    type: note.type,
    tint: note.tint,
    pinned: Boolean(note.pinned),
    tags: note.tags || [],
    items: note.items || [],
    attachments,
    remind_at: note.remindAt || null,
    deleted_at: note.deletedAt || null,
    parent_id: note.parentId || null,
    position: typeof note.position === "number" ? note.position : null,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

export async function pullNotes(supa: SupabaseClient): Promise<Note[]> {
  const { data, error } = await supa.from(TABLE).select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as Row[]).map(rowToNote);
}

export async function pushNotes(supa: SupabaseClient, userId: string, notes: Note[]) {
  if (!notes.length) return;
  const rows = notes.map((note) => noteToRow(note, userId));
  const { error } = await supa.from(TABLE).upsert(rows, { onConflict: "user_id,id" });
  if (error) throw error;
}

export async function removeNotes(supa: SupabaseClient, userId: string, ids: string[]) {
  if (!ids.length) return;
  const { error } = await supa.from(TABLE).delete().eq("user_id", userId).in("id", ids);
  if (error) throw error;
}

// Newest edit wins; on a tie the copy on this device wins.
export function mergeNotes(local: Note[], remote: Note[]): Note[] {
  const map = new Map<string, Note>();
  for (const note of remote) map.set(note.id, note);
  for (const note of local) {
    const other = map.get(note.id);
    if (!other || new Date(note.updatedAt).getTime() >= new Date(other.updatedAt).getTime()) {
      map.set(note.id, note);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
