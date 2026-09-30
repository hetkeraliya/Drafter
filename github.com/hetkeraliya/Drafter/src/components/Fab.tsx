"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { withViewTransition } from "@/lib/motion";
import { MicIcon } from "./Icons";

export function Fab() {
  const router = useRouter();
  return (
    <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-20 flex justify-center px-4">
      <div className="dock pointer-events-auto flex items-center gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow)]">
        <Link
          href="/notes/new?type=text"
          className="grid h-11 min-w-11 place-items-center rounded-xl bg-[var(--ink)] px-5 text-[15px] font-medium text-[#fafafa]"
          aria-label="Create note"
          onClick={(e) => {
            e.preventDefault();
            withViewTransition(() => router.push("/notes/new?type=text"));
          }}
        >
          New
        </Link>
        <button
          type="button"
          onClick={() => withViewTransition(() => router.push("/notes/new?type=audio"))}
          className="grid h-11 w-11 place-items-center rounded-xl text-[var(--ink)]"
          aria-label="New voice note"
        >
          <MicIcon size={18} />
        </button>
      </div>
    </div>
  );
}
