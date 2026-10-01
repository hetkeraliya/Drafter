"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openDesk } from "@/lib/deskBus";
import { downloadText } from "@/lib/share";
import { useStore } from "@/lib/store";
import { withViewTransition } from "@/lib/motion";
import { isStandalone, type BeforeInstallPromptEvent } from "@/lib/pwa";

export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut, resetDemo, notes, prefs, setTheme, setTypeScale, trash } = useStore();
  const router = useRouter();
  const [shown, setShown] = useState(open);
  const [leaving, setLeaving] = useState(false);
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

  useEffect(() => {
    if (open) {
      setShown(true);
      setLeaving(false);
      return;
    }
    if (!shown) return;
    setLeaving(true);
    const t = window.setTimeout(() => {
      setShown(false);
      setLeaving(false);
    }, 220);
    return () => window.clearTimeout(t);
  }, [open, shown]);

  if (!shown) return null;
  const out = leaving ? "out" : "";

  return (
    <div className="fixed inset-0 z-30" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" className={`veil ${out} absolute inset-0 bg-[var(--ink)]/25`} onClick={onClose} aria-label="Close menu" />
      <div className={`card panel ${out} absolute right-4 top-16 max-h-[80vh] w-[min(300px,calc(100vw-2rem))] overflow-auto`}>
        <div className="row border-b border-[var(--line)] px-4 py-4" style={{ ["--i" as string]: 0 }}>
          <p className="text-sm font-medium">{user?.name || "Guest"}</p>
          <p className="mt-0.5 text-[13px] text-[var(--muted)]">{user?.email || "demo@draftr.app"}</p>
          <p className="mt-2 text-[12px] text-[var(--muted)]">
            {prefs.streak ? `${prefs.streak}-day writing streak` : "Write today to start a streak"}
          </p>
        </div>
        <div className="p-1.5">
          <Link
            href="/about"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              withViewTransition(() => router.push("/about"));
            }}
            className="row block rounded-[10px] px-3 py-3 text-sm hover:bg-[var(--soft)]"
          >
            About
          </Link>
          <Link
            href="/motion"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              withViewTransition(() => router.push("/motion"));
            }}
            className="row block rounded-[10px] px-3 py-3 text-sm hover:bg-[var(--soft)]"
          >
            Motion
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              openDesk({ text: "" });
            }}
            className="row block w-full rounded-[10px] px-3 py-3 text-left text-sm hover:bg-[var(--soft)]"
          >
            Desk assistant
          </button>
          <Link
            href="/trash"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              withViewTransition(() => router.push("/trash"));
            }}
            className="row block rounded-[10px] px-3 py-3 text-sm hover:bg-[var(--soft)]"
          >
            Trash ({trash.length})
          </Link>
          {!installed && (
            <button
              type="button"
              onClick={async () => {
                if (installEvent) {
                  await installEvent.prompt();
                  setInstallEvent(null);
                }
                onClose();
              }}
              className="row block w-full rounded-[10px] px-3 py-3 text-left text-sm hover:bg-[var(--soft)]"
            >
              {installEvent ? "Install app" : "Add to Home Screen"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setTheme(prefs.theme === "dark" ? "light" : "dark")}
            className="row block w-full rounded-[10px] px-3 py-3 text-left text-sm hover:bg-[var(--soft)]"
          >
            {prefs.theme === "dark" ? "Light paper" : "Dark paper"}
          </button>
          <div className="row flex gap-1 px-3 py-2">
            {(["sm", "md", "lg"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setTypeScale(size)}
                className={`min-h-9 flex-1 rounded-[10px] text-xs ${prefs.typeScale === size ? "bg-[var(--ink)] text-[#fafafa]" : "bg-[var(--soft)]"}`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              downloadText("draftr-notes.txt", notes.map((n) => `# ${n.title}\n${n.body}`).join("\n\n"));
              onClose();
            }}
            className="row block w-full rounded-[10px] px-3 py-3 text-left text-sm hover:bg-[var(--soft)]"
          >
            Export all notes
          </button>
          <button
            type="button"
            onClick={() => {
              resetDemo();
              onClose();
            }}
            className="row block w-full rounded-[10px] px-3 py-3 text-left text-sm hover:bg-[var(--soft)]"
          >
            Load sample notes
          </button>
          <button
            type="button"
            onClick={() => {
              signOut();
              onClose();
              withViewTransition(() => router.push("/login"));
            }}
            className="row block w-full rounded-[10px] px-3 py-3 text-left text-sm text-[var(--muted)] hover:bg-[var(--soft)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
