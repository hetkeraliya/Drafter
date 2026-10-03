"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { mergeNotes, pullNotes, pushNotes, removeNotes } from "./cloud";
import { makeSeedNotes } from "./seed";
import { getSupabase } from "./supabase";
import { applyTheme } from "./theme";
import { todayKey } from "./thoughts";
import type { ChecklistItem, Note, PaperTheme, Prefs, SessionUser, SortMode } from "./types";

const NOTES_KEY = "draftr.notes.v7";
const NOTES_OLD = "draftr.notes.v6";
const USER_KEY = "draftr.user.v6";
const ONBOARD_KEY = "draftr.onboarded.v6";
const PREFS_KEY = "draftr.prefs.v8";
const PREFS_OLD = "draftr.prefs.v7";
const SEEDED_KEY = "draftr.seeded.v1";

const DEFAULT_PREFS: Prefs = {
  theme: "system",
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
  notice: string;
  signInDemo: (name?: string, email?: string) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  upsertNote: (note: Note) => void;
  patchNote: (id: string, patch: Partial<Note>) => void;
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
  loadSamples: () => void;
  setTheme: (theme: PaperTheme) => void;
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
  const [notice, setNotice] = useState("");
  const notesRef = useRef<Note[]>([]);
  const undoTimer = useRef<number | undefined>(undefined);
  const noticeTimer = useRef<number | undefined>(undefined);
  const supa = useMemo(() => getSupabase(), []);
  const cloud = Boolean(supa && user && !user.demo);
  const pulledFor = useRef("");
  const pushed = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(USER_KEY);
      const rawNotes = localStorage.getItem(NOTES_KEY) || localStorage.getItem(NOTES_OLD);
      const rawOn = localStorage.getItem(ONBOARD_KEY);
      const rawPrefs = localStorage.getItem(PREFS_KEY);
      const oldPrefs = rawPrefs ? null : localStorage.getItem(PREFS_OLD);
      setUser(rawUser ? JSON.parse(rawUser) : null);
      if (rawNotes) {
        setNotes((JSON.parse(rawNotes) as Note[]).map(hydrate));
      } else if (localStorage.getItem(SEEDED_KEY) !== "1") {
        // Brand-new install: start with sample notes so the app never opens empty.
        setNotes(makeSeedNotes().map(hydrate));
      }
      localStorage.setItem(SEEDED_KEY, "1");
      setOnboarded(rawOn === "1");
      if (rawPrefs) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(rawPrefs) });
      } else if (oldPrefs) {
        // Carry over what still exists; theme restarts on "system" so it follows the phone.
        const old = JSON.parse(oldPrefs) as Partial<Prefs>;
        setPrefs({
          ...DEFAULT_PREFS,
          sort: old.sort || DEFAULT_PREFS.sort,
          streak: old.streak || 0,
          lastWriteDay: old.lastWriteDay || "",
          thoughtCursor: old.thoughtCursor || 0,
        });
      }
    } catch {
      setNotes([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    notesRef.current = notes;
    if (!ready) return;
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {
      console.warn("Draftr: could not save notes locally (storage full)");
    }
  }, [notes, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    applyTheme(prefs.theme);
    if (prefs.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [prefs, ready]);

  // Real Supabase session -> app user. Demo/local users are never kicked out by this.
  useEffect(() => {
    if (!ready || !supa) return;
    let active = true;

    const apply = (session: Session | null) => {
      const u = session?.user;
      if (!u) return;
      const meta = (u.user_metadata || {}) as { name?: string; full_name?: string };
      const email = u.email || "";
      const next: SessionUser = {
        id: u.id,
        email,
        name: meta.name || meta.full_name || email.split("@")[0] || "You",
        demo: false,
      };
      setUser(next);
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    };

    supa.auth.getSession().then(({ data }) => {
      if (active) apply(data.session);
    });
    const { data: sub } = supa.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser((prev) => (prev && !prev.demo ? null : prev));
      } else {
        apply(session);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [ready, supa]);

  // First load after sign-in: pull cloud notes and merge with this device.
  useEffect(() => {
    if (!ready || !cloud || !supa || !user) return;
    if (pulledFor.current === user.id) return;
    pulledFor.current = user.id;
    let active = true;
    pullNotes(supa)
      .then((remote) => {
        if (active) setNotes((prev) => mergeNotes(prev, remote));
      })
      .catch((err) => {
        console.warn("Draftr cloud pull failed", err);
        pulledFor.current = "";
      });
    return () => {
      active = false;
    };
  }, [ready, cloud, supa, user]);

  // Push changes (debounced). Only runs after the first pull finished.
  useEffect(() => {
    if (!ready || !cloud || !supa || !user) return;
    if (pulledFor.current !== user.id) return;
    const userId = user.id;
    const timer = window.setTimeout(async () => {
      const changed: Note[] = [];
      const seen = new Set<string>();
      for (const note of notes) {
        seen.add(note.id);
        const sig = JSON.stringify(note);
        if (pushed.current.get(note.id) !== sig) changed.push(note);
      }
      const gone = Array.from(pushed.current.keys()).filter((id) => !seen.has(id));
      try {
        await pushNotes(supa, userId, changed);
        for (const note of changed) pushed.current.set(note.id, JSON.stringify(note));
        await removeNotes(supa, userId, gone);
        for (const id of gone) pushed.current.delete(id);
      } catch (err) {
        console.warn("Draftr cloud push failed", err);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [notes, ready, cloud, supa, user]);

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
    const wasCloud = Boolean(supa && user && !user.demo);
    pulledFor.current = "";
    pushed.current = new Map();
    setUser(null);
    localStorage.removeItem(USER_KEY);
    if (wasCloud && supa) {
      void supa.auth.signOut();
      setNotes([]); // cloud copy stays safe; nothing left behind on a shared device
    }
  }, [supa, user]);

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

  // Partial edit applied to the latest copy, so a late debounced save can never overwrite newer changes.
  const patchNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
    );
  }, []);

  const flash = useCallback((message: string) => {
    window.clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2600);
  }, []);

  const deleteNote = useCallback((id: string) => {
    const found = notesRef.current.find((n) => n.id === id);
    if (found) {
      window.clearTimeout(undoTimer.current);
      setUndo(found);
      setUndoLabel("Note moved to trash");
      undoTimer.current = window.setTimeout(() => {
        setUndo(null);
        setUndoLabel("");
      }, 6000);
    }
    const stamp = new Date().toISOString();
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deletedAt: stamp, updatedAt: stamp } : n)));
  }, []);

  const restoreNote = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deletedAt: null, updatedAt: new Date().toISOString() } : n)));
  }, []);

  const purgeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const undoDelete = useCallback(() => {
    if (!undo) return;
    const id = undo.id;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deletedAt: null, updatedAt: new Date().toISOString() } : n)));
    window.clearTimeout(undoTimer.current);
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
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n)));
  }, []);

  const tagNote = useCallback((id: string, tag: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const tags = n.tags || [];
        return { ...n, tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag], updatedAt: new Date().toISOString() };
      }),
    );
  }, []);

  const remindNote = useCallback((id: string, when: string | null) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, remindAt: when, updatedAt: new Date().toISOString() } : n)));
    if (when && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Adds any sample note that is missing (or brings a trashed one back). Never replaces your own notes.
  const loadSamples = useCallback(() => {
    const seeds = makeSeedNotes();
    const current = new Map(notesRef.current.map((n) => [n.id, n]));
    const missing = seeds.filter((s) => !current.has(s.id));
    const trashed = seeds.filter((s) => current.get(s.id)?.deletedAt);
    const added = missing.length + trashed.length;
    if (added === 0) {
      flash("Sample notes are already here");
      return;
    }
    const stamp = new Date().toISOString();
    setNotes((prev) => {
      const trashedIds = new Set(trashed.map((s) => s.id));
      const have = new Set(prev.map((n) => n.id));
      const revived = prev.map((n) => (trashedIds.has(n.id) ? { ...n, deletedAt: null, updatedAt: stamp } : n));
      return [...revived, ...missing.filter((s) => !have.has(s.id)).map(hydrate)];
    });
    flash(added === 1 ? "Added 1 sample note" : `Added ${added} sample notes`);
  }, [flash]);

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

  const live = useMemo(() => notes.filter((n) => !n.deletedAt), [notes]);
  const trash = useMemo(() => notes.filter((n) => Boolean(n.deletedAt)), [notes]);

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
      notice,
      signInDemo,
      signOut,
      completeOnboarding,
      upsertNote,
      patchNote,
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
      loadSamples,
      setTheme: (theme: PaperTheme) => patchPrefs({ theme }),
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
      notice,
      signInDemo,
      signOut,
      completeOnboarding,
      upsertNote,
      patchNote,
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
      loadSamples,
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
