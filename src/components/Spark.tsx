export function Spark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M16 3l1.6 9.4L27 16l-9.4 3.6L16 29l-1.6-9.4L5 16l9.4-3.6L16 3z" fill="currentColor" />
    </svg>
  );
}
