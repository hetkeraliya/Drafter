"use client";

import { useEffect, useRef, useState } from "react";

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
  const [pill, setPill] = useState({ x: 4, w: 0 });

  useEffect(() => {
    const root = wrap.current;
    if (!root) return;

    function measure() {
      const active = root.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!active) return;
      setPill({ x: active.offsetLeft, w: active.offsetWidth });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [value, items]);

  return (
    <div ref={wrap} className="seg" role="tablist">
      <span className="seg-pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w || undefined }} />
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          onClick={() => onChange(item.id)}
          aria-pressed={value === item.id}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
