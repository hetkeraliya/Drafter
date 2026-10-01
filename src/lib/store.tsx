"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SEED_NOTES } from "./seed";
import { todayKey } from "./thoughts";
import type { ChecklistItem, Note, PaperTheme, Prefs, SessionUser, SortMode, TypeScale } from "./types";

const NOTES_KEY = "draftr.notes.v7";
const NOTES_OLD = "draftr.notes.v6";
const USER_KEY = "draftr.user.v6";
const ONBOARD_KEY = "draftr.onboarded.v6";
const PREFS_KEY = "draftr.prefs.v7";

const DEFAULT_PREFS: Prefs = {
  theme: "light",
  typeScale: "md",
  sort: "new",
  streak: 0,
  lastWriteDay: "",
  thoughtCursor: 0,
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function hydrate(note: Note): Note {
  return {
    pinned: false,
    tags: [],
    deletedAt: null,
    remindAt: null,
    ...note,
    items: (note.items || []).map((item) => ({ parentId: null, due: "", ...item })),
  };
}

interface Store {
  ready: boolean;
  user: SessionUser | null;
  notes: Note[];
  trash: Note[];
  onboarded: boolean;
  cloud: boolean;
  prefs: Prefs;
  undoLabel: string;
  signInDemo: (name?: string, email?: string) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  upsertNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  purgeNote: (id: string) => void;
  undoDelete: () => void;
  toggleItem: (noteId: string, itemId: string) => void;
  addItem: (noteId: string, label: string) => void;
  removeItem: (noteId: string, itemId: string) => void;
  addSubtask: (noteId: string, parentId: string, label: string) => void;
  setItemDue: (noteId: string, itemId: string, due: string) => void;
  pinNote: (id: string) => void;
  tagNote: (id: string, tag: string) => void;
  remindNote: (id: string, when: string | null) => void;
  resetDemo: () => void;
  setTheme: (theme: PaperTheme) => void;
  setTypeScale: (scale: TypeScale) => void;
  setSort: (sort: SortMode) => void;
  bumpStreak: () => void;
  setThoughtCursor: (n: number) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [undo, setUndo] = useState<Note | null>(null);
  const [undoLabel, setUndoLabel] = useState("");
  const cloud = false;

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(USER_KEY);
      const rawNotes = localStorage.getItem(NOTES_KEY) || localStorage.getItem(NOTES_OLD);
      const rawOn = localStorage.getItem(ONBOARD_KEY);
      const rawPrefs = localStorage.getItem(PREFS_KEY);
      setUser(rawUser ? JSON.parse(rawUser) : null);
      setNotes(rawNotes ? (JSON.parse(rawNotes) as Note[]).map(hydrate) : []);
      setOnboarded(rawOn === "1");
      if (rawPrefs) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(rawPrefs) });
    } catch {
      setNotes([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.size = prefs.typeScale;
  }, [prefs, ready]);

  const patchPrefs = useCallback((next: Partial<Prefs>) => {
    setPrefs((prev) => ({ ...prev, ...next }));
  }, []);

  const signInDemo = useCallback((name?: string, email?: string) => {
    const next: SessionUser = {
      id: "demo",
      name: name?.trim() || "Demo",
      email: email?.trim() || "demo@draftr.app",
      demo: true,
    };
    setUser(next);
    localStorage.setItem(USER_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboarded(true);
    localStorage.setItem(ONBOARD_KEY, "1");
  }, []);

  const upsertNote = useCallback((note: Note) => {
    const next = hydrate({ ...note, updatedAt: note.updatedAt || new Date().toISOString() });
    setNotes((prev) => {
      const i = prev.findIndex((n) => n.id === note.id);
      if (i === -1) return [next, ...prev];
      const copy = [...prev];
      copy[i] = next;
      return copy;
    });
    const day = todayKey();
    setPrefs((prev) => {
      if (prev.lastWriteDay === day) return prev;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const cont = prev.lastWriteDay === todayKey(yesterday);
      return { ...prev, lastWriteDay: day, streak: cont ? prev.streak + 1 : 1 };
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const found = prev.find((n) => n.id === id);
      if (found) {
        setUndo(found);
        setUndoLabel("Note moved to trash");
        window.setTimeout(() => {
          setUndo((cur) => (cur?.id === found.id ? null : cur));
          setUndoLabel("");
        }, 6000);
      }
      return prev.map((n) => (n.id === id ? { ...n, deletedAt: new Date().toISOString() } : n));
    });
  }, []);

  const restoreNote = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deletedAt: null } : n)));
  }, []);

  const purgeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const undoDelete = useCallback(() => {
    if (!undo) return;
    const id = undo.id;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deletedAt: null } : n)));
    setUndo(null);
    setUndoLabel("");
  }, [undo]);

  const mapItems = useCallback((noteId: string, fn: (items: ChecklistItem[]) => ChecklistItem[]) => {
    setNotes((prev) =>
      prev.map((n) => (n.id !== noteId ? n : { ...n, items: fn(n.items), updatedAt: new Date().toISOString() })),
    );
  }, []);

  const toggleItem = useCallback((noteId: string, itemId: string) => {
    mapItems(noteId, (items) => items.map((it) => (it.id === itemId ? { ...it, checked: !it.checked } : it)));
  }, [mapItems]);

  const addItem = useCallback((noteId: string, label: string) => {
    if (!label.trim()) return;
    mapItems(noteId, (items) => [...items, { id: uid(), label: label.trim(), checked: false, parentId: null, due: "" }]);
  }, [mapItems]);

  const removeItem = useCallback((noteId: string, itemId: string) => {
    mapItems(noteId, (items) => items.filter((it) => it.id !== itemId && it.parentId !== itemId));
  }, [mapItems]);

  const addSubtask = useCallback((noteId: string, parentId: string, label: string) => {
    if (!label.trim()) return;
    mapItems(noteId, (items) => [...items, { id: uid(), label: label.trim(), checked: false, parentId, due: "" }]);
  }, [mapItems]);

  const setItemDue = useCallback((noteId: string, itemId: string, due: string) => {
    mapItems(noteId, (items) => items.map((it) => (it.id === itemId ? { ...it, due } : it)));
  }, [mapItems]);

  const pinNote = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }, []);

  const tagNote = useCallback((id: string, tag: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const tags = n.tags || [];
        return { ...n, tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] };
      }),
    );
  }, []);

  const remindNote = useCallback((id: string, when: string | null) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, remindAt: when } : n)));
    if (when && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const resetDemo = useCallback(() => {
    setNotes(SEED_NOTES.map(hydrate));
  }, []);

  const bumpStreak = useCallback(() => {
    const day = todayKey();
    setPrefs((prev) => {
      if (prev.lastWriteDay === day) return prev;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const cont = prev.lastWriteDay === todayKey(yesterday);
      return { ...prev, lastWriteDay: day, streak: cont ? prev.streak + 1 : 1 };
    });
  }, []);

  const live = notes.filter((n) => !n.deletedAt);
  const trash = notes.filter((n) => Boolean(n.deletedAt));

  const value = useMemo(
    () => ({
      ready,
      user,
      notes: live,
      trash,
      onboarded,
      cloud,
      prefs,
      undoLabel,
      signInDemo,
      signOut,
      completeOnboarding,
      upsertNote,
      deleteNote,
      restoreNote,
      purgeNote,
      undoDelete,
      toggleItem,
      addItem,
      removeItem,
      addSubtask,
      setItemDue,
      pinNote,
      tagNote,
      remindNote,
      resetDemo,
      setTheme: (theme: PaperTheme) => patchPrefs({ theme }),
      setTypeScale: (typeScale: TypeScale) => patchPrefs({ typeScale }),
      setSort: (sort: SortMode) => patchPrefs({ sort }),
      bumpStreak,
      setThoughtCursor: (thoughtCursor: number) => patchPrefs({ thoughtCursor }),
    }),
    [
      ready,
      user,
      live,
      trash,
      onboarded,
      cloud,
      prefs,
      undoLabel,
      signInDemo,
      signOut,
      completeOnboarding,
      upsertNote,
      deleteNote,
      restoreNote,
      purgeNote,
      undoDelete,
      toggleItem,
      addItem,
      removeItem,
      addSubtask,
      setItemDue,
      pinNote,
      tagNote,
      remindNote,
      resetDemo,
      patchPrefs,
      bumpStreak,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function newId() {
  return uid();
}
