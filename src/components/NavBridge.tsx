"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { resolveNav } from "@/lib/motion";

export function NavBridge() {
  const pathname = usePathname();
  useEffect(() => {
    resolveNav();
  }, [pathname]);
  return null;
}
