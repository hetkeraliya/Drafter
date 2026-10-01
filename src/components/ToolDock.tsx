"use client";

import { useRouter } from "next/navigation";
import { withViewTransition } from "@/lib/motion";
import { CameraIcon, GalleryIcon, PenIcon } from "./Icons";
import { Spark } from "./Spark";

export function ToolDock({ onSpark }: { onSpark?: () => void }) {
  const router = useRouter();

  function go(path: string) {
    withViewTransition(() => router.push(path));
  }

  return (
    <div className="dock flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow)]">
      <button
        type="button"
        onClick={() => (onSpark ? onSpark() : go("/thought"))}
        className="grid h-11 w-11 place-items-center rounded-full bg-[var(--ink)] text-[#fafafa]"
        aria-label="Today’s thought"
      >
        <Spark size={15} />
      </button>
      <button
        type="button"
        onClick={() => go("/notes/new?type=images")}
        className="grid h-11 w-11 place-items-center rounded-full text-[var(--ink)]"
        aria-label="Take a photo"
      >
        <CameraIcon size={17} />
      </button>
      <button
        type="button"
        onClick={() => go("/notes/new?type=images")}
        className="grid h-11 w-11 place-items-center rounded-full text-[var(--ink)]"
        aria-label="Add photos"
      >
        <GalleryIcon size={17} />
      </button>
      <button
        type="button"
        onClick={() => go("/notes/new?type=text")}
        className="grid h-11 w-11 place-items-center rounded-full text-[var(--ink)]"
        aria-label="Write a note"
      >
        <PenIcon size={17} />
      </button>
    </div>
  );
}
