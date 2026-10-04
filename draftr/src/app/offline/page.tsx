import { AppIcon } from "@/components/AppIcon";

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center px-8 text-center">
      <div className="flex flex-col items-center">
        <AppIcon size={72} />
        <h1 className="mt-6 text-[28px] font-bold leading-tight tracking-[-0.03em]">You’re Offline</h1>
        <p className="mt-2 max-w-[34ch] text-[15px] leading-6 text-[var(--muted)]">
          Draftr keeps your notes on this device. Reconnect for a fresh page, then open Notes again.
        </p>
      </div>
    </div>
  );
}
