"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useIsoLayoutEffect(() => {
    const root = wrap.current;
    if (!root) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!active) return;
      const next = { x: active.offsetLeft, w: active.offsetWidth };
      setPill((prev) => (prev && prev.x === next.x && prev.w === next.w ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [value, items]);

  // Only start animating after the first position is painted, so the pill never slides in from the corner.
  useEffect(() => {
    if (!pill || animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [pill, animate]);

  return (
    <div ref={wrap} className="seg" role="tablist">
      {pill && (
        <span
          className="seg-pill"
          data-animate={animate}
          style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
        />
      )}
      {items.map((item) => (
        <button key={item.id} type="button" role="tab" onClick={() => onChange(item.id)} aria-selected={value === item.id}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
