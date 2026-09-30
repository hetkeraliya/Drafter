"use client";

import { useRouter } from "next/navigation";
import { Phone } from "@/components/Phone";
import { Spark } from "@/components/Spark";
import { withViewTransition } from "@/lib/motion";

export default function AboutPage() {
  const router = useRouter();
  return (
    <Phone>
      <button type="button" onClick={() => withViewTransition(() => router.push("/notes"))} className="btn-ghost -ml-3">
        Back
      </button>
      <div className="pop mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ink)] text-[#fafafa]">
        <Spark size={18} />
      </div>
      <p className="meta mt-6">Studio 6</p>
      <h1 className="mt-3 max-w-[14ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.055em]">
        A small notebook with a quiet desk.
      </h1>
      <p className="rise-late mt-4 max-w-[42ch] text-sm leading-6 text-[var(--muted)]">
        Keep text, lists, photos, sketches, voice memos, and files in one place. Desk assistant runs on this device, so a note does not have to leave the machine.
      </p>
    </Phone>
  );
}
