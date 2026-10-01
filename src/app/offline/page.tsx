import { Phone } from "@/components/Phone";
import { Spark } from "@/components/Spark";

export default function OfflinePage() {
  return (
    <Phone>
      <div className="pop grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ink)] text-[#fafafa]">
        <Spark size={18} />
      </div>
      <p className="meta mt-6">Offline</p>
      <h1 className="mt-3 max-w-[12ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.055em]">
        Saved notes still live here.
      </h1>
      <p className="rise-late mt-4 max-w-[40ch] text-sm leading-6 text-[var(--muted)]">
        Draftr keeps drafts on this device. Reconnect when you want a fresh page, then open Notes again.
      </p>
    </Phone>
  );
}
