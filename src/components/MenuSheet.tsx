"use client";

import { useEffect, useState, type ReactNode } from "react";
import { openDesk } from "@/lib/deskBus";
import { downloadText } from "@/lib/share";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/useNav";
import { isStandalone, type BeforeInstallPromptEvent } from "@/lib/pwa";
import type { PaperTheme } from "@/lib/types";
import { ChevronRight } from "./Icons";
import { Segmented } from "./Segmented";
import { Sheet } from "./Sheet";

const THEMES: { id: PaperTheme; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function Row({
  label,
  detail,
  chevron = true,
  onClick,
}: {
  label: ReactNode;
  detail?: string;
  chevron?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="cell" onClick={onClick}>
      <span className="flex-1">{label}</span>
      {detail && <span className="text-[var(--muted)]">{detail}</span>}
      {chevron && (
        <span className="text-[var(--faint)]">
          <ChevronRight />
        </span>
      )}
    </button>
  );
}

// No open/close animation on purpose: the menu appears and disappears instantly.
export function MenuSheet({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect?: () => void }) {
  const { user, signOut, loadSamples, notes, prefs, setTheme, trash } = useStore();
  const nav = useNav();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const go = (href: string) => {
    onClose();
    nav.go(href);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={user?.name || "Draftr"}
      animate={false}
      action={
        <button type="button" className="nav-btn strong" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="group">
        {onSelect && <Row label="Select" chevron={false} onClick={onSelect} />}
        <Row label="Thought of the day" onClick={() => go("/thought")} />
        <Row
          label="Desk assistant"
          onClick={() => {
            onClose();
            openDesk({ text: "" });
          }}
        />
        <Row label="Trash" detail={trash.length ? String(trash.length) : ""} onClick={() => go("/trash")} />
      </div>

      <p className="group-label">Appearance</p>
      <div className="group p-3">
        <Segmented items={THEMES} value={prefs.theme} onChange={setTheme} />
      </div>

      <div className="group mt-6">
        <Row
          label="Load sample notes"
          chevron={false}
          onClick={() => {
            loadSamples();
            onClose();
          }}
        />
        <Row
          label="Export all notes"
          chevron={false}
          onClick={() => {
            downloadText("draftr-notes.txt", notes.filter((n) => n.type !== "folder").map((n) => `# ${n.title}\n${n.body}`).join("\n\n"));
            onClose();
          }}
        />
        {!installed && installEvent && (
          <Row
            label="Install app"
            chevron={false}
            onClick={async () => {
              await installEvent.prompt();
              setInstallEvent(null);
              onClose();
            }}
          />
        )}
        <Row label="About" onClick={() => go("/about")} />
      </div>

      <div className="group mt-6">
        <button
          type="button"
          className="cell justify-center font-semibold"
          onClick={() => {
            signOut();
            onClose();
            nav.go("/login", "back");
          }}
        >
          Sign out
        </button>
      </div>
    </Sheet>
  );
}
