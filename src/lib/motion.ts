export type NavDir = "forward" | "back" | "up" | "down" | "none";

type VTDocument = Document & {
  startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> };
};

let pending: (() => void) | null = null;

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Called by NavBridge once the new route has rendered, so the transition captures the real new page.
export function resolveNav() {
  if (!pending) return;
  const done = pending;
  pending = null;
  requestAnimationFrame(() => requestAnimationFrame(done));
}

// iOS-style navigation: push slides in from the right, back slides out, sheets rise from the bottom.
export function withViewTransition(run: () => void, dir: NavDir = "forward") {
  const doc = typeof document === "undefined" ? null : (document as VTDocument);
  if (!doc?.startViewTransition || prefersReducedMotion() || dir === "none" || pending) {
    run();
    return;
  }
  const root = document.documentElement;
  root.dataset.vt = dir;
  const transition = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        pending = resolve;
        run();
        window.setTimeout(() => {
          if (pending === resolve) {
            pending = null;
            resolve();
          }
        }, 800);
      }),
  );
  const clear = () => {
    delete root.dataset.vt;
  };
  transition.finished.then(clear, clear);
}
