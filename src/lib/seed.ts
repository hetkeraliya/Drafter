import type { Note } from "./types";

const FLOWERS =
  "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=800&q=80";
const BLOOMS =
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80";
const FIELD =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80";
const CITY =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=700&q=80";
const YELLOW =
  "https://images.unsplash.com/photo-1514565131-fce0801d5785?auto=format&fit=crop&w=900&q=80";

export const SEED_NOTES: Note[] = [
  {
    id: "shopping",
    title: "Shopping List",
    body: "",
    type: "todo",
    tint: "mint",
    items: [
      { id: "i1", label: "Vegetables", checked: true },
      { id: "i2", label: "Fruits", checked: false },
      { id: "i3", label: "Grocery", checked: false },
    ],
    attachments: [],
    createdAt: "2026-06-01T10:10:00.000Z",
    updatedAt: "2026-06-01T10:10:00.000Z",
  },
  {
    id: "thought",
    title: "Thought of the day",
    body: "Embrace the moment and let your spirit soar.\n\nEvery day is a fresh start—embrace it with hope and courage. Let each moment inspire you to grow and shine brighter than before.",
    type: "text",
    tint: "sky",
    items: [],
    attachments: [
      { id: "t1", kind: "image", url: FLOWERS, name: "flowers-1.jpg" },
      { id: "t2", kind: "image", url: BLOOMS, name: "flowers-2.jpg" },
    ],
    createdAt: "2026-06-01T10:10:00.000Z",
    updatedAt: "2026-06-01T10:10:00.000Z",
  },
  {
    id: "voice",
    title: "Voice memo",
    body: "",
    type: "audio",
    tint: "lilac",
    items: [],
    attachments: [{ id: "a1", kind: "audio", url: "", name: "memo.m4a" }],
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "files",
    title: "Files",
    body: "",
    type: "file",
    tint: "sand",
    items: [],
    attachments: [{ id: "f1", kind: "file", url: "", name: "notes.doc" }],
    createdAt: "2026-05-25T12:00:00.000Z",
    updatedAt: "2026-05-25T12:00:00.000Z",
  },
  {
    id: "highlights",
    title: "Highlights",
    body: "",
    type: "images",
    tint: "glass",
    items: [],
    attachments: [
      { id: "h1", kind: "image", url: FIELD, name: "field.jpg" },
      { id: "h2", kind: "image", url: BLOOMS, name: "bloom.jpg" },
      { id: "h3", kind: "image", url: FLOWERS, name: "flower.jpg" },
      { id: "h4", kind: "image", url: CITY, name: "vista.jpg" },
      { id: "h5", kind: "image", url: YELLOW, name: "city.jpg" },
    ],
    createdAt: "2026-05-25T12:00:00.000Z",
    updatedAt: "2026-05-25T12:00:00.000Z",
  },
  {
    id: "snapshots",
    title: "Snapshots",
    body: "",
    type: "images",
    tint: "glass",
    items: [],
    attachments: [
      { id: "s1", kind: "image", url: YELLOW, name: "city.jpg" },
      { id: "s2", kind: "image", url: FIELD, name: "more.jpg" },
    ],
    createdAt: "2026-05-25T12:00:00.000Z",
    updatedAt: "2026-05-25T12:00:00.000Z",
  },
  {
    id: "pdf",
    title: "Pdf",
    body: "",
    type: "file",
    tint: "rose",
    items: [],
    attachments: [{ id: "p1", kind: "file", url: "", name: "file.pdf" }],
    createdAt: "2026-05-20T12:00:00.000Z",
    updatedAt: "2026-05-20T12:00:00.000Z",
  },
];
