"use client";

import { useRouter } from "next/navigation";
import { Phone } from "@/components/Phone";
import { withViewTransition } from "@/lib/motion";
import { useStore } from "@/lib/store";

const STEPS = [
  { label: "Write", copy: "Capture a thought in a clean text note." },
  { label: "List", copy: "Check off tasks without extra chrome." },
  { label: "Keep", copy: "Store photos, voice memos, and files together." },
];

export default function OnboardingPage() {
  const { completeOnboarding } = useStore();
  const router = useRouter();

  function next() {
    completeOnboarding();
    withViewTransition(() => router.push("/notes"));
  }

  return (
    <Phone>
      <p className="meta">Start</p>
      <h1 className="mt-5 max-w-[13ch] text-[42px] font-semibold leading-[1.02] tracking-[-0.055em]">
        One desk for every draft.
      </h1>
      <ul className="mt-10 space-y-3">
        {STEPS.map((step, i) => (
          <li key={step.label} className="card tile flex items-start gap-4 p-5" style={{ ["--i" as string]: i }}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--soft)] text-xs font-semibold">
              0{i + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{step.label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{step.copy}</p>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={next} className="btn mt-8 w-full sm:w-auto">
        Open notes
      </button>
    </Phone>
  );
}
