"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { layoutCards } from "@/lib/canvasLayout";
import { haptic } from "@/lib/haptic";
import { prefersReducedMotion } from "@/lib/motion";
import type { Note } from "@/lib/types";
import { Card } from "./Card";

export interface CanvasActions {
  open: (note: Note) => void;
  stack: (draggedId: string, targetId: string) => void;
  intoFolder: (draggedId: string, folderId: string) => void;
  toParent: (draggedId: string) => void;
  toggle: (id: string) => void;
  place: (id: string, x: number, y: number) => void;
  placeMany: (spots: { id: string; x: number; y: number }[]) => void;
}

interface Props {
  items: Note[];
  kidsOf: (folderId: string) => Note[];
  actions: CanvasActions;
  selecting: boolean;
  selected: Set<string>;
  dim: Set<string> | null;
  focusId: string | null;
  onFocused: () => void;
}

const PAD_X = 28;
const PAD_TOP = 104;
const PAD_BOTTOM = 136;
const HOLD_MS = 350;
const ARM_MS = 200;

type Mode = "idle" | "pending" | "pan" | "lift";

const band = (v: number, min: number, max: number) => (v > max ? max + (v - max) * 0.28 : v < min ? min + (v - min) * 0.28 : v);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// A loose desk: cards lie where they were left, slightly tilted. Drag the background to look around,
// hold a card to pick it up, drop it anywhere, or onto another card to make a folder.
export function Canvas({ items, kidsOf, actions, selecting, selected, dim, focusId, onFocused }: Props) {
  const view = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const cam = useRef({ x: 0, y: 0 });
  const size = useRef({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  const mode = useRef<Mode>("idle");
  const start = useRef({ x: 0, y: 0, camX: 0, camY: 0, id: "" });
  const track = useRef({ x: 0, y: 0, t: 0, vx: 0, vy: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const timer = useRef(0);
  const moved = useRef(false);
  const raf = useRef(0);
  const lift = useRef<{ id: string; offX: number; offY: number; x: number; y: number; over: string; armTimer: number } | null>(null);
  const armed = useRef<string | null>(null);
  const hot = useRef(false);
  const reset = useRef<string | null>(null);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const layout = useMemo(() => layoutCards(items), [items]);
  const byId = useMemo(() => new Map(items.map((n) => [n.id, n])), [items]);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // first automatic placement is saved once, so the desk stays exactly as it was laid out
  useEffect(() => {
    if (layout.fresh.length) actionsRef.current.placeMany(layout.fresh);
  }, [layout.fresh]);

  const range = useCallback(() => {
    const b = layoutRef.current.bounds;
    const { w, h } = size.current;
    let minX = w - (b.maxX + PAD_X);
    let maxX = PAD_X - b.minX;
    if (minX > maxX) minX = maxX = (minX + maxX) / 2;
    let minY = h - (b.maxY + PAD_BOTTOM);
    let maxY = PAD_TOP - b.minY;
    if (minY > maxY) minY = maxY = (minY + maxY) / 2;
    return { minX, maxX, minY, maxY };
  }, []);

  const apply = useCallback(() => {
    const el = inner.current;
    if (el) el.style.transform = `translate3d(${cam.current.x}px, ${cam.current.y}px, 0)`;
  }, []);

  const stopMotion = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  }, []);

  const glide = useCallback(
    (toX: number, toY: number, ms = 320) => {
      stopMotion();
      if (prefersReducedMotion()) {
        cam.current = { x: toX, y: toY };
        apply();
        return;
      }
      const fromX = cam.current.x;
      const fromY = cam.current.y;
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / ms);
        const e = 1 - Math.pow(1 - k, 3);
        cam.current = { x: fromX + (toX - fromX) * e, y: fromY + (toY - fromY) * e };
        apply();
        raf.current = k < 1 ? requestAnimationFrame(step) : 0;
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply, stopMotion],
  );

  // measure the viewport and keep the camera inside the desk
  useLayoutEffect(() => {
    const el = view.current;
    if (!el) return;
    const measure = () => {
      size.current = { w: el.clientWidth, h: el.clientHeight };
      const r = range();
      if (!ready) {
        cam.current = { x: r.maxX, y: r.maxY };
        setReady(true);
      } else {
        cam.current = { x: clamp(cam.current.x, r.minX, r.maxX), y: clamp(cam.current.y, r.minY, r.maxY) };
      }
      apply();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [apply, range, ready, layout.bounds]);

  // bring a newly added card into view
  useEffect(() => {
    if (!focusId) return;
    const s = layout.spots.get(focusId);
    if (!s) return;
    const r = range();
    const { w, h } = size.current;
    glide(clamp(w / 2 - (s.x + s.w / 2), r.minX, r.maxX), clamp(h / 2 - (s.y + s.h / 2) - 20, r.minY, r.maxY), 380);
    onFocused();
  }, [focusId, layout.spots, glide, onFocused, range]);

  // mouse wheel and trackpad
  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopMotion();
      const r = range();
      cam.current = { x: clamp(cam.current.x - e.deltaX, r.minX, r.maxX), y: clamp(cam.current.y - e.deltaY, r.minY, r.maxY) };
      apply();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [apply, range, stopMotion]);

  const toCanvas = useCallback((cx: number, cy: number) => {
    const box = view.current?.getBoundingClientRect();
    return { x: cx - (box?.left ?? 0) - cam.current.x, y: cy - (box?.top ?? 0) - cam.current.y };
  }, []);

  const setArmed = useCallback((id: string | null) => {
    if (armed.current && armed.current !== id) els.current.get(armed.current)?.removeAttribute("data-armed");
    armed.current = id;
    if (id) els.current.get(id)?.setAttribute("data-armed", "true");
  }, []);

  const hotParent = useCallback((on: boolean) => {
    if (hot.current === on) return;
    hot.current = on;
    document.querySelectorAll<HTMLElement>('[data-drop="parent"]').forEach((el) => {
      el.dataset.hot = on ? "true" : "false";
    });
  }, []);

  const baseTransform = (rot: number) => `rotate(${rot}deg)`;

  const updateLift = useCallback(() => {
    const l = lift.current;
    if (!l) return;
    const spot = layoutRef.current.spots.get(l.id);
    const el = els.current.get(l.id);
    if (!spot || !el) return;
    const p = toCanvas(pointer.current.x, pointer.current.y);
    l.x = p.x - l.offX;
    l.y = p.y - l.offY;
    el.style.transform = `translate(${l.x - spot.x}px, ${l.y - spot.y}px) scale(1.05)`;

    // over the back button: move out of this folder
    const back = document.querySelector<HTMLElement>('[data-drop="parent"]');
    if (back) {
      const r = back.getBoundingClientRect();
      const px = pointer.current.x;
      const py = pointer.current.y;
      const over = px >= r.left - 10 && px <= r.right + 10 && py >= r.top - 10 && py <= r.bottom + 10;
      hotParent(over);
      if (over) {
        window.clearTimeout(l.armTimer);
        l.over = "";
        setArmed(null);
        return;
      }
    }

    const dragged = byId.get(l.id);
    const cx = l.x + spot.w / 2;
    const cy = l.y + spot.h / 2;
    let target = "";
    layoutRef.current.spots.forEach((s, id) => {
      if (id === l.id || target) return;
      if (Math.abs(cx - (s.x + s.w / 2)) < s.w * 0.3 && Math.abs(cy - (s.y + s.h / 2)) < s.h * 0.3) target = id;
    });
    const targetNote = target ? byId.get(target) : undefined;
    const canStack = Boolean(targetNote && dragged && (targetNote.type === "folder" || dragged.type !== "folder"));
    if (target && canStack) {
      if (l.over !== target) {
        window.clearTimeout(l.armTimer);
        l.over = target;
        setArmed(null);
        l.armTimer = window.setTimeout(() => {
          if (lift.current?.over === target) {
            haptic(10);
            setArmed(target);
          }
        }, ARM_MS);
      }
    } else {
      window.clearTimeout(l.armTimer);
      l.over = "";
      setArmed(null);
    }
  }, [byId, hotParent, setArmed, toCanvas]);

  // keeps the desk moving while a card is held near the edge of the screen
  const edgeLoop = useCallback(() => {
    if (!lift.current) return;
    const { x, y } = pointer.current;
    const { w, h } = size.current;
    const box = view.current?.getBoundingClientRect();
    const top = (box?.top ?? 0) + 70;
    const bottom = (box?.top ?? 0) + h - 120;
    let vx = 0;
    let vy = 0;
    if (x < 56) vx = ((56 - x) / 56) * 14;
    else if (x > w - 56) vx = -((x - (w - 56)) / 56) * 14;
    if (y < top) vy = ((top - y) / 70) * 14;
    else if (y > bottom) vy = -((y - bottom) / 120) * 14;
    if (vx || vy) {
      const r = range();
      cam.current = { x: clamp(cam.current.x + vx, r.minX, r.maxX), y: clamp(cam.current.y + vy, r.minY, r.maxY) };
      apply();
      updateLift();
    }
    raf.current = requestAnimationFrame(edgeLoop);
  }, [apply, range, updateLift]);

  const startLift = useCallback(() => {
    const id = start.current.id;
    const spot = layoutRef.current.spots.get(id);
    const el = els.current.get(id);
    if (!id || !spot || !el) return;
    mode.current = "lift";
    moved.current = true;
    const p = toCanvas(pointer.current.x, pointer.current.y);
    lift.current = { id, offX: p.x - spot.x, offY: p.y - spot.y, x: spot.x, y: spot.y, over: "", armTimer: 0 };
    el.dataset.lift = "true";
    el.style.zIndex = "60";
    haptic(14);
    updateLift();
    stopMotion();
    raf.current = requestAnimationFrame(edgeLoop);
  }, [edgeLoop, stopMotion, toCanvas, updateLift]);

  const endLift = useCallback(
    (cancelled: boolean) => {
      const l = lift.current;
      if (!l) return;
      window.clearTimeout(l.armTimer);
      stopMotion();
      lift.current = null;
      const el = els.current.get(l.id);
      const spot = layoutRef.current.spots.get(l.id);
      const target = armed.current;
      const toParent = hot.current;
      hotParent(false);
      setArmed(null);
      if (el) {
        delete el.dataset.lift;
        el.style.zIndex = "";
      }
      const a = actionsRef.current;
      let changed = false;
      if (!cancelled) {
        if (toParent) {
          haptic(12);
          a.toParent(l.id);
          changed = true;
        } else if (target) {
          haptic(12);
          if (byId.get(target)?.type === "folder") a.intoFolder(l.id, target);
          else a.stack(l.id, target);
          changed = true;
        } else if (spot) {
          a.place(l.id, l.x, l.y);
          changed = true;
        }
      }
      // keep the carried position on screen until React has drawn the new one, then put the tilt back
      reset.current = changed ? l.id : null;
      if (!changed && el && spot) el.style.transform = baseTransform(spot.rot);
      window.setTimeout(() => {
        if (reset.current === l.id) {
          reset.current = null;
          const s = layoutRef.current.spots.get(l.id);
          const node = els.current.get(l.id);
          if (node && s) node.style.transform = baseTransform(s.rot);
        }
      }, 160);
    },
    [byId, hotParent, setArmed, stopMotion],
  );

  useLayoutEffect(() => {
    if (!reset.current) return;
    const id = reset.current;
    const s = layout.spots.get(id);
    const node = els.current.get(id);
    if (node && s) node.style.transform = baseTransform(s.rot);
    reset.current = null;
  });

  const inertia = useCallback(
    (vx0: number, vy0: number) => {
      stopMotion();
      let vx = vx0;
      let vy = vy0;
      let last = performance.now();
      const step = (t: number) => {
        const dt = Math.min(32, t - last);
        last = t;
        const decay = Math.pow(0.94, dt / 16);
        vx *= decay;
        vy *= decay;
        const r = range();
        let nx = cam.current.x + vx * dt;
        let ny = cam.current.y + vy * dt;
        if (nx < r.minX || nx > r.maxX) {
          nx = clamp(nx, r.minX, r.maxX);
          vx = 0;
        }
        if (ny < r.minY || ny > r.maxY) {
          ny = clamp(ny, r.minY, r.maxY);
          vy = 0;
        }
        cam.current = { x: nx, y: ny };
        apply();
        raf.current = Math.abs(vx) + Math.abs(vy) > 0.02 ? requestAnimationFrame(step) : 0;
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply, range, stopMotion],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      if (mode.current === "lift") {
        updateLift();
        return;
      }
      if (mode.current === "pending") {
        if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) {
          window.clearTimeout(timer.current);
          mode.current = "pan";
          moved.current = true;
          track.current = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 };
        } else return;
      }
      if (mode.current === "pan") {
        const r = range();
        cam.current = {
          x: band(start.current.camX + (e.clientX - start.current.x), r.minX, r.maxX),
          y: band(start.current.camY + (e.clientY - start.current.y), r.minY, r.maxY),
        };
        apply();
        const now = performance.now();
        const dt = Math.max(1, now - track.current.t);
        track.current.vx = track.current.vx * 0.6 + ((e.clientX - track.current.x) / dt) * 0.4;
        track.current.vy = track.current.vy * 0.6 + ((e.clientY - track.current.y) / dt) * 0.4;
        track.current.x = e.clientX;
        track.current.y = e.clientY;
        track.current.t = now;
      }
    };
    const onUp = () => {
      window.clearTimeout(timer.current);
      const m = mode.current;
      mode.current = "idle";
      if (m === "lift") endLift(false);
      else if (m === "pan") {
        const r = range();
        const { x, y } = cam.current;
        if (x < r.minX || x > r.maxX || y < r.minY || y > r.maxY) {
          glide(clamp(x, r.minX, r.maxX), clamp(y, r.minY, r.maxY), 320);
        } else if (performance.now() - track.current.t < 90) {
          inertia(track.current.vx, track.current.vy);
        }
      }
      if (moved.current) window.setTimeout(() => (moved.current = false), 60);
    };
    const onCancel = () => {
      window.clearTimeout(timer.current);
      const m = mode.current;
      mode.current = "idle";
      if (m === "lift") endLift(true);
      moved.current = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mode.current === "lift") {
        mode.current = "idle";
        endLift(true);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      stopMotion();
    };
  }, [apply, endLift, glide, inertia, range, stopMotion, updateLift]);

  function down(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopMotion();
    pointer.current = { x: e.clientX, y: e.clientY };
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
    const id = card?.dataset.card || "";
    start.current = { x: e.clientX, y: e.clientY, camX: cam.current.x, camY: cam.current.y, id };
    moved.current = false;
    mode.current = "pending";
    window.clearTimeout(timer.current);
    if (id && !selecting && !(e.target as HTMLElement).closest("[data-no-open]")) {
      timer.current = window.setTimeout(() => {
        if (mode.current === "pending") startLift();
      }, HOLD_MS);
    }
  }

  return (
    <div ref={view} className="canvas" data-ready={ready} onPointerDown={down} onContextMenu={(e) => e.preventDefault()}>
      <div ref={inner} className="canvas-inner">
        {items.map((note) => {
          const s = layout.spots.get(note.id);
          if (!s) return null;
          const faded = dim ? !dim.has(note.id) : false;
          return (
            <div
              key={note.id}
              ref={(el) => {
                if (el) els.current.set(note.id, el);
                else els.current.delete(note.id);
              }}
              role="link"
              tabIndex={0}
              data-card={note.id}
              data-dim={faded}
              data-folder={note.type === "folder"}
              data-selected={selected.has(note.id)}
              className="card"
              style={{ left: s.x, top: s.y, width: s.w, height: s.h, transform: `rotate(${s.rot}deg)` }}
              onClick={(e) => {
                if (moved.current) return;
                if ((e.target as HTMLElement).closest("[data-no-open]")) return;
                if (selecting) actions.toggle(note.id);
                else actions.open(note);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (selecting ? actions.toggle(note.id) : actions.open(note));
              }}
              aria-label={note.title || "Untitled"}
            >
              {selecting && <span className="card-select" data-on={selected.has(note.id)} aria-hidden />}
              <Card note={note} count={note.type === "folder" ? kidsOf(note.id).length : 0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
