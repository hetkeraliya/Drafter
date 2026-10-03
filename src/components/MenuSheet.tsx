"use client";

import { useEffect, useState, type ReactNode } from "react";
import { openDesk } from "@/lib/deskBus";
import { downloadText } from "@/lib/share";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/useNav";
import { isStandalone, type BeforeInstallPromptEvent } from "@/lib/pwa";
import type { PaperTheme } from "@/lib/types";
import {
  ChevronRight,
  DownloadAppIcon,
  DownloadIcon,
  InfoIcon,
  PhotoIcon,
  SparkleIcon,
  TrashIcon,
} from "./Icons";
import { Segmented } from "./Segmented";
import { Sheet } from "./Sheet";

const THEMES: { id: PaperTheme; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function Row({
  icon,
  color,
  label,
  detail,
  chevron = true,
  onClick,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  detail?: string;
  chevron?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="cell" onClick={onClick}>
      <span className="cell-icon" style={{ background: color }}>
        {icon}
      </span>
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
export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  const name = user?.name || "Guest";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const go = (href: string) => {
    onClose();
    nav.go(href);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Draftr"
      animate={false}
      action={
        <button type="button" className="nav-btn strong" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="group">
        <div className="cell">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-[image:var(--g-brand)] text-[22px] font-semibold text-white shadow-[var(--glow)]">
            {initials || "D"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold">{name}</p>
            <p className="truncate text-[15px] text-[var(--muted)]">{user?.email || "demo@draftr.app"}</p>
            <p className="mt-0.5 text-[13px] text-[var(--muted)]">
              {prefs.streak ? `${prefs.streak}-day writing streak` : "Write today to start a streak"}
            </p>
          </div>
        </div>
      </div>

      <p className="group-label">Appearance</p>
      <div className="group p-3">
        <Segmented items={THEMES} value={prefs.theme} onChange={setTheme} />
      </div>

      <div className="group mt-6">
        <Row
          icon={<SparkleIcon size={18} />}
          color="var(--g-violet)"
          label="Desk assistant"
          onClick={() => {
            onClose();
            openDesk({ text: "" });
          }}
        />
        <Row icon={<TrashIcon size={18} />} color="var(--g-red)" label="Trash" detail={trash.length ? String(trash.length) : ""} onClick={() => go("/trash")} />
        <Row icon={<InfoIcon size={18} />} color="var(--g-cyan)" label="About" onClick={() => go("/about")} />
      </div>

      <div className="group mt-6">
        <Row
          icon={<DownloadIcon size={18} />}
          color="var(--g-green)"
          label="Export all notes"
          chevron={false}
          onClick={() => {
            downloadText("draftr-notes.txt", notes.map((n) => `# ${n.title}\n${n.body}`).join("\n\n"));
            onClose();
          }}
        />
        <Row
          icon={<PhotoIcon size={18} />}
          color="var(--g-orange)"
          label="Load sample notes"
          chevron={false}
          onClick={() => {
            loadSamples();
            onClose();
          }}
        />
        {!installed && (
          <Row
            icon={<DownloadAppIcon size={18} />}
            color="var(--g-brand)"
            label={installEvent ? "Install app" : "Add to Home Screen"}
            chevron={false}
            onClick={async () => {
              if (installEvent) {
                await installEvent.prompt();
                setInstallEvent(null);
              }
              onClose();
            }}
          />
        )}
      </div>

      <div className="group mt-6">
        <button
          type="button"
          className="cell justify-center font-medium text-[var(--red)]"
          onClick={() => {
            signOut();
            onClose();
            nav.go("/login", "back");
          }}
        >
          Sign Out
        </button>
      </div>
      <p className="group-foot text-center">
        {notes.length} {notes.length === 1 ? "note" : "notes"} on this device
      </p>
    </Sheet>
  );
}
