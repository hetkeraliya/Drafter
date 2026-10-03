export type Ink = "light" | "dark";

export interface Backdrop {
  gradient: string;
  ink: Ink;
  /** index of the composition used, so the deck can avoid repeating it back to back */
  hue: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pct = (a: number, b: number) => `${Math.round(rnd(a, b))}%`;
const at = () => `${pct(0, 100)} ${pct(0, 100)}`;

// Five lighting setups. Each is generated fresh (positions, strengths, angles) so no two cards match.
// Black and white only: the variety comes from where the light falls.
const SETUPS = [
  // soft pools of light drifting across the card
  (dark: boolean) => {
    const hi = dark ? "255,255,255" : "255,255,255";
    const lo = dark ? "255,255,255" : "0,0,0";
    return [
      `radial-gradient(70% 55% at ${at()}, rgba(${hi}, ${dark ? rnd(0.22, 0.4) : 1}), transparent 70%)`,
      `radial-gradient(60% 50% at ${at()}, rgba(${lo}, ${dark ? rnd(0.08, 0.16) : rnd(0.1, 0.2)}), transparent 72%)`,
      `radial-gradient(55% 45% at ${at()}, rgba(${lo}, ${dark ? rnd(0.06, 0.12) : rnd(0.07, 0.14)}), transparent 70%)`,
    ];
  },
  // one diagonal beam
  (dark: boolean) => {
    const a = Math.round(rnd(105, 255));
    const mid = Math.round(rnd(38, 62));
    const w = Math.round(rnd(14, 26));
    const c = dark ? `rgba(255,255,255,${rnd(0.18, 0.32)})` : `rgba(255,255,255,0.95)`;
    const s = dark ? "rgba(255,255,255,0)" : `rgba(0,0,0,${rnd(0.1, 0.18)})`;
    return [`linear-gradient(${a}deg, ${s} ${mid - w - 14}%, ${c} ${mid}%, ${s} ${mid + w + 14}%)`];
  },
  // a single orb, like a moon or a lamp
  (dark: boolean) => {
    const x = Math.round(rnd(18, 82));
    const y = Math.round(rnd(14, 52));
    const r = Math.round(rnd(7, 15));
    const core = dark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.9)";
    const halo = dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)";
    return [`radial-gradient(circle at ${x}% ${y}%, ${core} 0, ${core} ${r}%, ${halo} ${r + 6}%, transparent ${r + 42}%)`];
  },
  // horizon glow rising from an edge
  (dark: boolean) => {
    const x = Math.round(rnd(20, 80));
    const edge = Math.random() < 0.5 ? "100%" : "0%";
    const c = dark ? `rgba(255,255,255,${rnd(0.28, 0.46)})` : `rgba(255,255,255,1)`;
    const d = dark ? "rgba(255,255,255,0.05)" : `rgba(0,0,0,${rnd(0.12, 0.2)})`;
    return [`radial-gradient(120% 70% at ${x}% ${edge}, ${c}, transparent 66%)`, `radial-gradient(90% 60% at ${100 - x}% ${edge === "100%" ? "0%" : "100%"}, ${d}, transparent 70%)`];
  },
  // two crossing soft bands
  (dark: boolean) => {
    const a = Math.round(rnd(20, 160));
    const b = (a + Math.round(rnd(60, 110))) % 360;
    const c = dark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.9)";
    const d = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
    return [
      `linear-gradient(${a}deg, transparent 30%, ${c} 46%, transparent 62%)`,
      `linear-gradient(${b}deg, transparent 38%, ${d} 54%, transparent 70%)`,
    ];
  },
];

export function makeBackdrop(avoid?: number): Backdrop {
  let variant = Math.floor(Math.random() * SETUPS.length);
  for (let t = 0; t < 8 && variant === avoid; t++) variant = Math.floor(Math.random() * SETUPS.length);

  const dark = Math.random() < 0.55;
  const angle = Math.round(rnd(120, 240));
  const base = dark
    ? `linear-gradient(${angle}deg, #000000 0%, #161616 55%, #050505 100%)`
    : `linear-gradient(${angle}deg, #ffffff 0%, #e9e9e9 60%, #f6f6f6 100%)`;

  const layers = [...SETUPS[variant](dark), base];
  return { gradient: layers.join(", "), ink: dark ? "light" : "dark", hue: variant };
}
