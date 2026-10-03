"use client";

import type { ReactNode } from "react";
import { ComposeIcon, ListIcon, PhotoIcon, SparkleIcon } from "@/components/Icons";
import { Screen } from "@/components/Screen";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/useNav";

const STEPS: { label: string; copy: string; color: string; icon: ReactNode }[] = [
  { label: "Write", copy: "Capture a thought in a clean text note.", color: "var(--g-violet)", icon: <ComposeIcon size={22} /> },
  { label: "List", copy: "Check things off, add smaller steps and due dates.", color: "var(--g-cyan)", icon: <ListIcon size={22} /> },
  { label: "Keep", copy: "Store photos, voice memos and files together.", color: "var(--g-orange)", icon: <PhotoIcon size={22} /> },
  { label: "Think", copy: "A new thought every day, and a deck to swipe through.", color: "var(--g-pink)", icon: <SparkleIcon size={22} /> },
];

export default function OnboardingPage() {
  const { completeOnboarding } = useStore();
  const nav = useNav();

  function next() {
    completeOnboarding();
    nav.go("/notes");
  }

  return (
    <Screen bare>
      <h1 className="pt-10 text-center text-[34px] font-bold leading-[1.1] tracking-[-0.03em]">
        Welcome to
        <br />
        Draftr
      </h1>
      <ul className="mx-auto mt-12 max-w-[420px] space-y-7">
        {STEPS.map((step) => (
          <li key={step.label} className="fade-up flex items-start gap-4" style={{ animationDelay: `${STEPS.indexOf(step) * 90 + 80}ms` }}>
            <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl text-white shadow-[0_10px_20px_-8px_rgba(60,50,160,0.55),inset_0_1px_0_rgba(255,255,255,0.4)]" style={{ background: step.color }}>
              {step.icon}
            </span>
            <div>
              <p className="text-[17px] font-semibold">{step.label}</p>
              <p className="mt-0.5 text-[15px] leading-snug text-[var(--muted)]">{step.copy}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mx-auto mt-14 max-w-[420px]">
        <button type="button" onClick={next} className="btn w-full">
          Continue
        </button>
      </div>
    </Screen>
  );
}
