"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spark } from "@/components/Spark";
import { withViewTransition } from "@/lib/motion";
import { useStore } from "@/lib/store";

export default function SplashPage() {
  const router = useRouter();
  const { ready, user, onboarded } = useStore();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const next = !user ? "/login" : !onboarded ? "/onboarding" : "/notes";
      withViewTransition(() => router.replace(next));
    }, 1100);
    return () => clearTimeout(t);
  }, [ready, user, onboarded, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="breathe grid h-14 w-14 place-items-center rounded-2xl bg-[var(--ink)] text-[#fafafa] shadow-[var(--shadow)]">
        <Spark size={22} />
      </div>
      <p className="rise mt-6 text-[32px] font-semibold tracking-[-0.05em]">Draftr</p>
      <p className="rise-late mt-1 text-sm text-[var(--muted)]">Quiet notes. Clean desk.</p>
    </div>
  );
}
