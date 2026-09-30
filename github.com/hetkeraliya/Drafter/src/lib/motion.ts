export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function withViewTransition(run: () => void) {
  const doc = typeof document === "undefined" ? null : (document as Document & { startViewTransition?: (cb: () => void) => void });
  if (!doc?.startViewTransition || prefersReducedMotion()) {
    run();
    return;
  }
  doc.startViewTransition(run);
}
