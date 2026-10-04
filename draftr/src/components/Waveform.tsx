export function Waveform({ bars = 11, live = false }: { bars?: number; live?: boolean }) {
  const heights = [10, 18, 26, 16, 30, 14, 24, 12, 20, 22, 15];
  return (
    <div className="flex h-8 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-current ${live ? "wave-bar" : ""}`}
          style={{ height: heights[i % heights.length], animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  );
}
