import type { Note } from "./types";

// Soft grayscale gradient "photos" as data URIs: always available, no network, right in both themes.
function art(l1: number, l2: number, l3: number, seed = 0) {
  const x = 20 + ((seed * 37) % 60);
  const y = 18 + ((seed * 53) % 56);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(0 0% ${l1}%)"/><stop offset="1" stop-color="hsl(0 0% ${l2}%)"/></linearGradient>` +
    `<radialGradient id="r" cx="${x}%" cy="${y}%" r="55%"><stop offset="0" stop-color="hsl(0 0% ${l3}%)" stop-opacity=".95"/>` +
    `<stop offset="1" stop-color="hsl(0 0% ${l3}%)" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="400" height="300" fill="url(#g)"/><rect width="400" height="300" fill="url(#r)"/>` +
    `<circle cx="${300 - seed * 11}" cy="${70 + seed * 9}" r="46" fill="#fff" fill-opacity=".14"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SUNRISE = art(92, 38, 100, 1);
const LAGOON = art(24, 70, 96, 2);
const MEADOW = art(60, 12, 90, 3);
const DUSK = art(10, 52, 84, 4);
const CITRUS = art(98, 58, 100, 5);

// Stable ids so "Load sample notes" can add what is missing without ever duplicating or wiping anything.
export function makeSeedNotes(now = Date.now()): Note[] {
  const at = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  const day = 24 * 60;

  return [
    {
      id: "sample-welcome",
      title: "Welcome to Draftr",
      body:
        "A quiet place for text, lists, photos, voice memos and files.\n\n" +
        "Swipe a note right to pin it, or left to delete it. Tap the mic to record, or use Dictate inside a note to speak your words.\n\n" +
        "Open Desk to outline, tidy or ask questions about your notes, all on this device.",
      type: "text",
      tint: "sky",
      items: [],
      attachments: [],
      pinned: true,
      tags: ["ideas"],
      createdAt: at(12),
      updatedAt: at(12),
    },
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
        { id: "i3a", label: "Rice and lentils", checked: false, parentId: "i3" },
        { id: "i4", label: "Filter coffee", checked: false },
      ],
      attachments: [],
      tags: ["home"],
      createdAt: at(95),
      updatedAt: at(95),
    },
    {
      id: "thought",
      title: "Thought of the day",
      body: "Embrace the moment and let your spirit soar.\n\nEvery day is a fresh start. Embrace it with hope and courage, and let each moment inspire you to grow.",
      type: "text",
      tint: "sky",
      items: [],
      attachments: [
        { id: "t1", kind: "image", url: SUNRISE, name: "sunrise.jpg" },
        { id: "t2", kind: "image", url: DUSK, name: "dusk.jpg" },
      ],
      tags: ["today", "ideas"],
      createdAt: at(day + 40),
      updatedAt: at(day + 40),
    },
    {
      id: "weekend",
      title: "Weekend plan",
      body: "",
      type: "todo",
      tint: "mint",
      items: [
        { id: "w1", label: "Tidy desk", checked: true },
        { id: "w2", label: "Write a thought", checked: false },
        { id: "w3", label: "Go outside", checked: false },
      ],
      attachments: [],
      tags: ["today"],
      createdAt: at(day * 2 + 30),
      updatedAt: at(day * 2 + 30),
    },
    {
      id: "voice",
      title: "Voice memo",
      body: "",
      type: "audio",
      tint: "lilac",
      items: [],
      attachments: [{ id: "a1", kind: "audio", url: "", name: "memo.m4a" }],
      createdAt: at(day * 3),
      updatedAt: at(day * 3),
    },
    {
      id: "reading",
      title: "Book notes",
      body:
        "Chapter 4: small habits compound. The point is not the size of the step but how often it is taken.\n\n" +
        "Quote to keep: a page a day is a book a year.",
      type: "text",
      tint: "cream",
      items: [],
      attachments: [],
      tags: ["school"],
      createdAt: at(day * 5),
      updatedAt: at(day * 5),
    },
    {
      id: "highlights",
      title: "Highlights",
      body: "",
      type: "images",
      tint: "glass",
      items: [],
      attachments: [
        { id: "h1", kind: "image", url: MEADOW, name: "meadow.jpg" },
        { id: "h2", kind: "image", url: LAGOON, name: "lagoon.jpg" },
        { id: "h3", kind: "image", url: SUNRISE, name: "sunrise.jpg" },
        { id: "h4", kind: "image", url: CITRUS, name: "citrus.jpg" },
        { id: "h5", kind: "image", url: DUSK, name: "dusk.jpg" },
      ],
      createdAt: at(day * 9),
      updatedAt: at(day * 9),
    },
    {
      id: "files",
      title: "Files",
      body: "",
      type: "file",
      tint: "sand",
      items: [],
      attachments: [{ id: "f1", kind: "file", url: "", name: "notes.doc" }],
      createdAt: at(day * 14),
      updatedAt: at(day * 14),
    },
    {
      id: "snapshots",
      title: "Snapshots",
      body: "",
      type: "images",
      tint: "glass",
      items: [],
      attachments: [
        { id: "s1", kind: "image", url: CITRUS, name: "citrus.jpg" },
        { id: "s2", kind: "image", url: MEADOW, name: "meadow.jpg" },
      ],
      createdAt: at(day * 21),
      updatedAt: at(day * 21),
    },
    {
      id: "pdf",
      title: "Pdf",
      body: "",
      type: "file",
      tint: "rose",
      items: [],
      attachments: [{ id: "p1", kind: "file", url: "", name: "file.pdf" }],
      createdAt: at(day * 34),
      updatedAt: at(day * 34),
    },
  ];
}
