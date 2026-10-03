"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  action?: ReactNode;
  leading?: ReactNode;
  full?: boolean;
  animate?: boolean;
  children: ReactNode;
}

// iOS bottom sheet: grabber, centred title, drag-down to dismiss. animate={false} makes it appear instantly.
export function Sheet({ open, onClose, title, action, leading, full = false, animate = true, children }: Props) {
  const [mounted, setMounted] = useState(open);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef(0);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setMounted(true);
    else setMounted(false);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panel.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  function down(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!dragging) return;
    setDy(Math.max(0, e.clientY - start.current));
  }
  function up() {
    if (!dragging) return;
    setDragging(false);
    if (dy > 110) onClose();
    setDy(0);
  }

  return (
    <div className={animate ? "animate" : ""}>
      <div className="sheet-veil" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sheet ${full ? "full" : ""} outline-none`}
        style={{
          transform: dy ? `translateY(${dy}px)` : undefined,
          transition: dragging ? "none" : dy === 0 ? undefined : "transform 300ms var(--spring)",
        }}
      >
        <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <div className="grabber" />
          <div className="sheet-head">
            <div className="flex justify-start">{leading}</div>
            <h2>{title}</h2>
            <div className="flex justify-end">{action}</div>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
