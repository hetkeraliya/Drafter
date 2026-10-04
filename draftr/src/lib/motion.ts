export type NavDir = "forward" | "back" | "up" | "down" | "none";

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Kept so every screen can still ask for a direction, but pages now simply swap: instant and light.
export function resolveNav() {}

export function withViewTransition(run: () => void, dir: NavDir = "forward") {
  void dir;
  run();
}
