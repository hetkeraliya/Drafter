"use client";

import { AppIcon } from "@/components/AppIcon";
import { Screen } from "@/components/Screen";
import { useStore } from "@/lib/store";

export default function AboutPage() {
  const { cloud, notes } = useStore();
  return (
    <Screen title="About" back={{ href: "/notes", label: "Notes" }}>
      <div className="flex flex-col items-center pt-8 text-center">
        <AppIcon size={84} />
        <h1 className="mt-5 text-[28px] font-bold tracking-[-0.03em]">Draftr</h1>
        <p className="mt-1 text-[15px] text-[var(--muted)]">A small notebook with a quiet desk.</p>
      </div>
      <p className="selectable mx-auto mt-8 max-w-[44ch] text-center text-[15px] leading-6 text-[var(--muted)]">
        Keep text, lists, photos, sketches, voice memos and files in one place. The desk assistant runs on this device, so a note does not have to leave it.
      </p>
      <div className="group mt-8">
        <div className="cell">
          <span className="flex-1">Version</span>
          <span className="text-[var(--muted)]">0.3.0</span>
        </div>
        <div className="cell">
          <span className="flex-1">Notes</span>
          <span className="text-[var(--muted)]">{notes.length}</span>
        </div>
        <div className="cell">
          <span className="flex-1">Storage</span>
          <span className="text-[var(--muted)]">{cloud ? "Synced to your account" : "This device"}</span>
        </div>
      </div>
    </Screen>
  );
}
