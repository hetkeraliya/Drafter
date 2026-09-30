export function Waveform({ bars = 11, live = false }: { bars?: number; live?: boolean }) {
  const heights = [10, 18, 28, 16, 32, 14, 26, 12, 20, 24, 15];
  return (
    <div className="flex h-9 items-center gap-[5px]">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-[5px] bg-current ${live ? "wave-bar" : ""}`}
          style={{ height: heights[i % heights.length], animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  );
}
