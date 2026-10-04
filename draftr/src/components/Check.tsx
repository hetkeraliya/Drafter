"use client";

import { haptic } from "@/lib/haptic";
import { CheckIcon } from "./Icons";

export function Check({
  checked,
  onToggle,
  small = false,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  small?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      data-on={checked}
      className={`check ${small ? "sm" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        haptic(10);
        onToggle();
      }}
    >
      <CheckIcon size={small ? 11 : 14} />
    </button>
  );
}
