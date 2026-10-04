"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppIcon } from "@/components/AppIcon";
import { useStore } from "@/lib/store";

export default function SplashPage() {
  const router = useRouter();
  const { ready, user, onboarded } = useStore();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      router.replace(!user ? "/login" : !onboarded ? "/onboarding" : "/notes");
    }, 650);
    return () => clearTimeout(t);
  }, [ready, user, onboarded, router]);

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="fade-up flex flex-col items-center">
        <AppIcon size={88} />
        <p className="mt-5 text-[28px] font-bold tracking-[-0.03em]">Draftr</p>
        <p className="mt-1 text-[15px] text-[var(--muted)]">Quiet notes. Clean desk.</p>
      </div>
    </div>
  );
}
