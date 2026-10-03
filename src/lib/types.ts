export type NoteType = "text" | "todo" | "images" | "audio" | "file";

export type Tint = "mint" | "sky" | "lilac" | "sand" | "rose" | "cream" | "glass";

export type Tab = "all" | "todo" | "images" | "imported";

export type AttachmentKind = "image" | "audio" | "file" | "sketch";

export type SortMode = "new" | "old" | "type";

export type PaperTheme = "system" | "light" | "dark";

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  due?: string;
  parentId?: string | null;
}

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  url: string;
  name: string;
  start?: number;
  end?: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  type: NoteType;
  tint: Tint;
  items: ChecklistItem[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  tags?: string[];
  deletedAt?: string | null;
  remindAt?: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  demo: boolean;
}

export interface Prefs {
  theme: PaperTheme;
  sort: SortMode;
  streak: number;
  lastWriteDay: string;
  thoughtCursor: number;
}

export interface DailyThought {
  day: string;
  headline: string;
  body: string;
  prompt: string;
  author?: string;
  source?: string;
  live?: boolean;
}
