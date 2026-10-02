"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

export type FlyFn = (dir: 1 | -1) => void;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

interface Props {
  depth: number;
  gradient: string;
  active: boolean;
  onGone: () => void;
  register?: (fly: FlyFn) => void;
  color: string;
  children: ReactNode;
}

const OUT_MS = 380;

// Top card: drag sideways (or just tap) and it slides off to that side, revealing the next one.
export function SwipeCard({ depth, gradient, active, onGone, register, color, children }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const startX = useRef(0);
  const moved = useRef(false);
  const fired = useRef(false);

  function fly(dir: 1 | -1) {
    if (leaving !== 0 || fired.current) return;
    setDragging(false);
    setLeaving(dir);
    window.setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      onGone();
    }, OUT_MS);
  }

  useEffect(() => {
    if (active) register?.(fly);
  });

  function down(e: ReactPointerEvent<HTMLDivElement>) {
    if (!active || leaving !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const next = e.clientX - startX.current;
    if (Math.abs(next) > 6) moved.current = true;
    setDx(next);
  }

  function up() {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dx) > 90) fly(dx > 0 ? 1 : -1);
    else if (!moved.current) fly(1);
    else setDx(0);
  }

  function cancel() {
    setDragging(false);
    setDx(0);
  }

  let transform: string;
  let opacity = 1;
  if (depth === 0) {
    if (leaving) {
      transform = `translateX(${leaving * 125}%) rotate(${leaving * 16}deg)`;
      opacity = 0;
    } else {
      transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
    }
  } else {
    // Cards underneath ease up as the top one is dragged away.
    const pull = depth === 1 ? Math.min(1, (leaving ? 120 : Math.abs(dx)) / 120) : 0;
    const scale = 1 - depth * 0.05 + pull * 0.05;
    const lift = depth * 16 - pull * 16;
    transform = `translateY(${lift}px) scale(${scale})`;
    opacity = depth > 2 ? 0 : 1;
  }

  const style: CSSProperties = {
    transform,
    opacity,
    zIndex: 10 - depth,
    color,
    touchAction: "pan-y",
    transition: dragging ? "none" : `transform ${OUT_MS}ms cubic-bezier(.2,.8,.2,1), opacity ${OUT_MS}ms ease`,
    cursor: active ? (dragging ? "grabbing" : "grab") : "default",
    pointerEvents: active ? "auto" : "none",
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[28px] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.55)] select-none"
      style={style}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
    >
      <div className="absolute inset-0" style={{ background: gradient }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
      <div className="relative flex h-full flex-col justify-end p-7 pb-8">{children}</div>
    </div>
  );
}
