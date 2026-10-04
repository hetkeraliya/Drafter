"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { withViewTransition, type NavDir } from "./motion";

export function useNav() {
  const router = useRouter();
  return useMemo(
    () => ({
      go: (href: string, dir: NavDir = "forward") => withViewTransition(() => router.push(href), dir),
      back: (href: string) => withViewTransition(() => router.push(href), "back"),
      replace: (href: string) => router.replace(href),
    }),
    [router],
  );
}
