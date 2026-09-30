export function StatusBar() {
  return (
    <div className="flex items-center justify-between px-7 pt-4 text-[13px] font-medium text-slate-700/80">
      <span>9:41</span>
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="tracking-tight">●●●●</span>
        <span>wifi</span>
        <span className="inline-block h-2.5 w-5 rounded-[3px] border border-slate-600/70">
          <span className="ml-[1px] mt-[1px] block h-1.5 w-3 rounded-[2px] bg-slate-700/80" />
        </span>
      </div>
    </div>
  );
}
