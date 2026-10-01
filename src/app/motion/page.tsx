"use client";

import { useRouter } from "next/navigation";
import { Phone } from "@/components/Phone";
import { withViewTransition } from "@/lib/motion";

const CARDS = [
  { title: "Scroll reveal", body: "Cards rise as they enter the page, using a view timeline." },
  { title: "Spring settle", body: "Buttons ease in with a linear spring, not a flat curve." },
  { title: "Paper tilt", body: "A quiet 3D lean on hover, still flat enough for a notebook." },
  { title: "Ink line", body: "A rule draws itself from the left, like a pen finishing a line." },
];

export default function MotionPage() {
  const router = useRouter();
  return (
    <Phone>
      <button type="button" onClick={() => withViewTransition(() => router.push("/notes"))} className="btn-ghost -ml-3">
        Back
      </button>
      <p className="meta mt-8">Motion study</p>
      <h1 className="mt-3 max-w-[12ch] text-[40px] font-semibold leading-[1.02] tracking-[-0.055em]">Modern CSS, kept quiet.</h1>
      <p className="mt-4 max-w-[42ch] text-sm leading-6 text-[var(--muted)]">
        View timelines, spring easing, paper tilt, and an ink line. Motion stays off if the device asks for less movement.
      </p>
      <div className="ink-line mt-6 w-24" />

      <div className="stack-fan mt-8 space-y-3">
        {["Top sheet", "Middle sheet", "Bottom sheet"].map((label, index) => (
          <div key={label} className="card tilt p-4" style={{ marginLeft: index * 10 }}>
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-1 text-[13px] text-[var(--muted)]">Stacked enter, then a small lean.</p>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-3">
        {CARDS.map((card) => (
          <article key={card.title} className="card scroll-card tilt p-4">
            <p className="text-sm font-medium">{card.title}</p>
            <p className="mt-1 text-[13px] leading-6 text-[var(--muted)]">{card.body}</p>
          </article>
        ))}
      </div>

      <button type="button" className="btn spring sheen mt-8" onClick={() => withViewTransition(() => router.push("/notes"))}>
        Back to notes
      </button>
    </Phone>
  );
}
