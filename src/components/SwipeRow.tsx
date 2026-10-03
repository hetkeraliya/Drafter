"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { haptic } from "@/lib/haptic";

export interface SwipeAction {
  label: string;
  icon?: ReactNode;
  color: string;
  run: () => void;
}

const W = 78;

// Row with iOS swipe actions: drag right for leading actions, left for trailing ones. A long swipe
// fires the first action on that side. Content follows the finger with a rubber-band at the edges.
export function SwipeRow({
  children,
  leading = [],
  trailing = [],
  index = 0,
}: {
  children: ReactNode;
  leading?: SwipeAction[];
  trailing?: SwipeAction[];
  index?: number;
}) {
  const [x, setX] = useState(0);
  const [drag, setDrag] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const base = useRef(0);
  const live = useRef<"idle" | "pending" | "swiping" | "scroll">("idle");
  const moved = useRef(false);

  const maxL = leading.length * W;
  const maxR = trailing.length * W;

  useEffect(() => {
    if (x === 0) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setX(0);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [x]);

  function clamp(v: number) {
    if (v > maxL) return maxL + (v - maxL) * 0.35;
    if (v < -maxR) return -maxR + (v + maxR) * 0.35;
    return v;
  }

  function down(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-no-swipe]")) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    base.current = x;
    live.current = "pending";
    moved.current = false;
  }

  function move(e: React.PointerEvent) {
    if (live.current === "idle" || live.current === "scroll") return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (live.current === "pending") {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        live.current = "scroll";
        return;
      }
      if (Math.abs(dx) < 8) return;
      live.current = "swiping";
      setDrag(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    moved.current = true;
    const next = base.current + dx;
    if ((next > 0 && !maxL) || (next < 0 && !maxR)) {
      setX(0);
      return;
    }
    setX(clamp(next));
  }

  function up() {
    const was = live.current;
    live.current = "idle";
    if (was !== "swiping") return;
    setDrag(false);
    const full = 150;
    if (x <= -full && trailing[0]) {
      haptic(14);
      trailing[0].run();
      setX(0);
    } else if (x >= full && leading[0]) {
      haptic(14);
      leading[0].run();
      setX(0);
    } else if (x < -maxR * 0.45) setX(-maxR);
    else if (x > maxL * 0.45) setX(maxL);
    else setX(0);
  }

  const act = (a: SwipeAction) => {
    haptic(10);
    a.run();
    setX(0);
  };

  return (
    <div ref={root} className="row-wrap" style={{ "--i": index } as React.CSSProperties}>
      {leading.length > 0 && (
        <div className="row-actions" style={{ left: 0, width: x > 0 ? x : 0 }}>
          {leading.map((a) => (
            <button key={a.label} type="button" style={{ background: a.color }} onClick={() => act(a)} tabIndex={x > 0 ? 0 : -1}>
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
      {trailing.length > 0 && (
        <div className="row-actions" style={{ right: 0, width: x < 0 ? -x : 0 }}>
          {trailing.map((a) => (
            <button key={a.label} type="button" style={{ background: a.color }} onClick={() => act(a)} tabIndex={x < 0 ? 0 : -1}>
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <div
        className="row-content"
        style={{
          transform: `translateX(${x}px)`,
          transition: drag ? "none" : "transform 420ms var(--spring)",
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => {
          if (moved.current) {
            e.stopPropagation();
            e.preventDefault();
            moved.current = false;
            return;
          }
          if (x !== 0) {
            e.stopPropagation();
            e.preventDefault();
            setX(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
