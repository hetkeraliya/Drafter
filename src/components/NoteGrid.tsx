"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { haptic } from "@/lib/haptic";
import { prefersReducedMotion } from "@/lib/motion";
import type { Note } from "@/lib/types";
import { Tile } from "./Tile";

const HOLD_MS = 380;
const ARM_MS = 200;

export interface GridActions {
  open: (note: Note) => void;
  reorder: (ids: string[]) => void;
  stack: (draggedId: string, targetId: string) => void;
  intoFolder: (draggedId: string, folderId: string) => void;
  toParent: (draggedId: string) => void;
  toggle: (id: string) => void;
}

interface Props {
  items: Note[];
  kidsOf: (folderId: string) => Note[];
  actions: GridActions;
  canDrag: boolean;
  selecting: boolean;
  selected: Set<string>;
  hasParent: boolean;
}

interface Press {
  id: string;
  pointerId: number;
  type: string;
  x: number;
  y: number;
  timer: number;
}

interface Live {
  id: string;
  offX: number;
  offY: number;
  w: number;
  h: number;
  x: number;
  y: number;
  armedAt: number;
  overId: string;
  armTimer: number;
}

// Touch-first drag and drop: hold a card to lift it, slide it to reorder, hold it over another card to
// stack them into a new folder, over a folder to move inside, or over the back button to move out.
export function NoteGrid({ items, kidsOf, actions, canDrag, selecting, selected, hasParent }: Props) {
  const [order, setOrder] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const tiles = useRef(new Map<string, HTMLDivElement>());
  const ghost = useRef<HTMLDivElement>(null);
  const press = useRef<Press | null>(null);
  const live = useRef<Live | null>(null);
  const orderRef = useRef<string[]>([]);
  const armedRef = useRef<string | null>(null);
  const parentHot = useRef(false);
  const justDragged = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const prevRects = useRef(new Map<string, { x: number; y: number }>());
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const byId = useMemo(() => new Map(items.map((n) => [n.id, n])), [items]);

  // While not dragging, the grid simply follows the saved order.
  useEffect(() => {
    if (dragId) return;
    const ids = items.map((n) => n.id);
    orderRef.current = ids;
    setOrder(ids);
  }, [items, dragId]);

  const shown = order.filter((id) => byId.has(id));

  // Cards slide to their new places when the order changes (positions measured on the page, so scrolling never fakes a move).
  useLayoutEffect(() => {
    const next = new Map<string, { x: number; y: number }>();
    tiles.current.forEach((el, id) => {
      next.set(id, { x: el.offsetLeft, y: el.offsetTop });
    });
    if (!prefersReducedMotion()) {
      next.forEach((pos, id) => {
        const before = prevRects.current.get(id);
        const el = tiles.current.get(id);
        if (!before || !el) return;
        const dx = before.x - pos.x;
        const dy = before.y - pos.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: 200,
          easing: "cubic-bezier(0.32, 0.72, 0, 1)",
        });
      });
    }
    prevRects.current = next;
  });

  const layout = useCallback(() => {
    const box = grid.current?.getBoundingClientRect();
    const out: { id: string; left: number; top: number; w: number; h: number }[] = [];
    if (!box) return out;
    tiles.current.forEach((el, id) => {
      out.push({ id, left: box.left + el.offsetLeft, top: box.top + el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    });
    return out;
  }, []);

  const setArmed = useCallback((id: string | null) => {
    armedRef.current = id;
    setArmedId(id);
  }, []);

  const hotParent = useCallback((on: boolean) => {
    if (parentHot.current === on) return;
    parentHot.current = on;
    document.querySelectorAll<HTMLElement>('[data-drop="parent"]').forEach((el) => {
      el.dataset.hot = on ? "true" : "false";
    });
  }, []);

  const moveGhost = useCallback(() => {
    const l = live.current;
    const g = ghost.current;
    if (!l || !g) return;
    g.style.transform = `translate3d(${l.x}px, ${l.y}px, 0) scale(1.05) rotate(1.2deg)`;
  }, []);

  const evaluate = useCallback(() => {
    const l = live.current;
    if (!l) return;
    const { x: px, y: py } = pointer.current;
    const dragged = byId.get(l.id);
    if (!dragged) return;

    // over the back button: move out of this folder
    const back = document.querySelector<HTMLElement>('[data-drop="parent"]');
    if (back) {
      const r = back.getBoundingClientRect();
      const over = px >= r.left - 8 && px <= r.right + 8 && py >= r.top - 8 && py <= r.bottom + 8;
      hotParent(over);
      if (over) {
        window.clearTimeout(l.armTimer);
        l.overId = "";
        setArmed(null);
        return;
      }
    }

    const rects = layout().filter((r) => r.id !== l.id);
    const target = rects.find((r) => px >= r.left && px <= r.left + r.w && py >= r.top && py <= r.top + r.h);
    if (!target) {
      window.clearTimeout(l.armTimer);
      l.overId = "";
      if (armedRef.current) setArmed(null);
      // dragged past the last card: go to the end
      const last = rects[rects.length - 1];
      if (last && (py > last.top + last.h || (py > last.top && px > last.left + last.w))) {
        const next = orderRef.current.filter((id) => id !== l.id).concat(l.id);
        if (next.join() !== orderRef.current.join()) {
          orderRef.current = next;
          setOrder(next);
        }
      }
      return;
    }

    const targetNote = byId.get(target.id);
    const nx = (px - target.left) / target.w;
    const ny = (py - target.top) / target.h;
    const centre = nx > 0.24 && nx < 0.76 && ny > 0.24 && ny < 0.76;
    const canStack = Boolean(targetNote) && (targetNote!.type === "folder" || dragged.type !== "folder");

    if (centre && canStack) {
      if (l.overId !== target.id) {
        window.clearTimeout(l.armTimer);
        l.overId = target.id;
        if (armedRef.current) setArmed(null);
        l.armTimer = window.setTimeout(() => {
          if (live.current && live.current.overId === target.id) {
            haptic(10);
            setArmed(target.id);
          }
        }, ARM_MS);
      }
      return;
    }

    window.clearTimeout(l.armTimer);
    l.overId = "";
    if (armedRef.current) setArmed(null);

    const rest = orderRef.current.filter((id) => id !== l.id);
    const at = rest.indexOf(target.id);
    if (at === -1) return;
    const horizontal = Math.abs(nx - 0.5) >= Math.abs(ny - 0.5);
    const after = horizontal ? nx > 0.5 : ny > 0.5;
    const next = [...rest.slice(0, after ? at + 1 : at), l.id, ...rest.slice(after ? at + 1 : at)];
    if (next.join() !== orderRef.current.join()) {
      haptic(6);
      orderRef.current = next;
      setOrder(next);
    }
  }, [byId, hotParent, layout, setArmed]);

  // keeps the page scrolling while a card is held near the top or bottom edge
  const autoScroll = useCallback(() => {
    if (!live.current) return;
    const y = pointer.current.y;
    const edge = 90;
    const vh = window.innerHeight;
    let speed = 0;
    if (y > vh - edge) speed = Math.min(16, ((y - (vh - edge)) / edge) * 16);
    else if (y < edge + 40) speed = -Math.min(16, ((edge + 40 - y) / (edge + 40)) * 16);
    if (speed) {
      window.scrollBy(0, speed);
      evaluate();
    }
    raf.current = requestAnimationFrame(autoScroll);
  }, [evaluate]);

  const finish = useCallback(
    (cancelled: boolean) => {
      const l = live.current;
      if (!l) return;
      window.clearTimeout(l.armTimer);
      cancelAnimationFrame(raf.current);
      const finalOrder = orderRef.current.slice();
      const armed = armedRef.current;
      const toParent = parentHot.current;
      live.current = null;
      hotParent(false);
      setArmed(null);
      justDragged.current = true;
      window.setTimeout(() => {
        justDragged.current = false;
      }, 60);
      setDragId(null);
      if (cancelled) return;
      const a = actionsRef.current;
      if (toParent) {
        haptic(12);
        a.toParent(l.id);
      } else if (armed) {
        haptic(12);
        const target = byId.get(armed);
        if (target?.type === "folder") a.intoFolder(l.id, armed);
        else a.stack(l.id, armed);
      } else {
        a.reorder(finalOrder);
      }
    },
    [byId, hotParent, setArmed],
  );

  const beginDrag = useCallback(
    (p: Press) => {
      const el = tiles.current.get(p.id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      pointer.current = { x: p.x, y: p.y };
      live.current = {
        id: p.id,
        offX: p.x - r.left,
        offY: p.y - r.top,
        w: r.width,
        h: r.height,
        x: r.left,
        y: r.top,
        armedAt: 0,
        overId: "",
        armTimer: 0,
      };
      haptic(14);
      orderRef.current = items.map((n) => n.id);
      setDragId(p.id);
      raf.current = requestAnimationFrame(autoScroll);
    },
    [autoScroll, items],
  );

  // after the ghost mounts, put it exactly over the card that was picked up
  useLayoutEffect(() => {
    if (dragId) moveGhost();
  }, [dragId, moveGhost]);

  // Window listeners: one set for the whole grid. A touch that has not become a drag still scrolls normally.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = press.current;
      const l = live.current;
      if (l) {
        pointer.current = { x: e.clientX, y: e.clientY };
        l.x = e.clientX - l.offX;
        l.y = e.clientY - l.offY;
        moveGhost();
        evaluate();
        return;
      }
      if (!p || e.pointerId !== p.pointerId) return;
      const dist = Math.hypot(e.clientX - p.x, e.clientY - p.y);
      if (p.type === "mouse") {
        if (dist > 6) {
          window.clearTimeout(p.timer);
          press.current = null;
          beginDrag({ ...p, x: e.clientX, y: e.clientY });
        }
      } else if (dist > 10) {
        window.clearTimeout(p.timer);
        press.current = null;
      }
    };
    const onUp = (e: PointerEvent) => {
      const p = press.current;
      if (p && e.pointerId === p.pointerId) {
        window.clearTimeout(p.timer);
        press.current = null;
      }
      if (live.current) finish(false);
    };
    const onCancel = () => {
      const p = press.current;
      if (p) {
        window.clearTimeout(p.timer);
        press.current = null;
      }
      if (live.current) finish(true);
    };
    // once a card is lifted the page must not scroll under the finger
    const onTouchMove = (e: TouchEvent) => {
      if (live.current && e.cancelable) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && live.current) finish(true);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf.current);
    };
  }, [beginDrag, evaluate, finish, moveGhost]);

  function down(e: React.PointerEvent, id: string) {
    if (!canDrag || selecting) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const timer = window.setTimeout(() => {
      const p = press.current;
      if (!p) return;
      press.current = null;
      beginDrag(p);
    }, HOLD_MS);
    press.current = { id, pointerId: e.pointerId, type: e.pointerType, x: e.clientX, y: e.clientY, timer };
  }

  const dragged = dragId ? byId.get(dragId) : null;
  const ghostSize = live.current;

  return (
    <>
      <div ref={grid} className="tiles" data-dragging={Boolean(dragId)}>
        {shown.map((id) => {
          const note = byId.get(id)!;
          const isDrag = id === dragId;
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) tiles.current.set(id, el);
                else tiles.current.delete(id);
              }}
              role="link"
              tabIndex={0}
              className="tile"
              data-ghost={isDrag}
              data-armed={armedId === id}
              data-folder={note.type === "folder"}
              data-selected={selected.has(id)}
              onPointerDown={(e) => down(e, id)}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                if (justDragged.current) return;
                if (selecting) actions.toggle(id);
                else actions.open(note);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (selecting ? actions.toggle(id) : actions.open(note));
              }}
              aria-label={note.title || "Untitled"}
            >
              <Tile note={note} kids={note.type === "folder" ? kidsOf(note.id) : []} selecting={selecting} selected={selected.has(id)} />
            </div>
          );
        })}
      </div>
      {dragged && ghostSize && (
        <div
          ref={ghost}
          className="tile tile-lift"
          style={{ width: ghostSize.w, height: ghostSize.h }}
          aria-hidden
        >
          <Tile note={dragged} kids={dragged.type === "folder" ? kidsOf(dragged.id) : []} />
        </div>
      )}
      {dragId && hasParent && <p className="drag-hint">Drop on Back to move out of this folder</p>}
    </>
  );
}
