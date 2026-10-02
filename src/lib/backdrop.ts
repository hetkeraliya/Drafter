export type Ink = "light" | "dark";

export interface Backdrop {
  gradient: string;
  ink: Ink;
  hue: number;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

// Hue offsets that sit well together: analogous, split, triad, warm/cool pairs.
const SCHEMES = [
  [0, 28, -28],
  [0, 150, 210],
  [0, 120, 240],
  [0, 45, 320],
  [0, 180, 30],
  [0, 60, 300],
];

// A fresh mesh gradient on every call. Pass the previous hue so neighbours never look alike.
export function makeBackdrop(avoidHue?: number): Backdrop {
  let hue = Math.floor(rnd(0, 360));
  for (let t = 0; t < 10 && avoidHue !== undefined && gap(hue, avoidHue) < 70; t++) {
    hue = Math.floor(rnd(0, 360));
  }

  const [o0, o1, o2] = pick(SCHEMES);
  const h0 = (hue + o0 + 360) % 360;
  const h1 = (hue + o1 + 360) % 360;
  const h2 = (hue + o2 + 360) % 360;
  const angle = Math.floor(rnd(120, 240));
  const deep = Math.random() < 0.6;

  // Three anchor zones so the colour blobs spread out instead of clumping.
  const a = `${Math.round(rnd(0, 40))}% ${Math.round(rnd(0, 35))}%`;
  const b = `${Math.round(rnd(60, 100))}% ${Math.round(rnd(25, 60))}%`;
  const c = `${Math.round(rnd(15, 85))}% ${Math.round(rnd(70, 100))}%`;

  if (deep) {
    const layers = [
      `radial-gradient(75% 55% at ${a}, hsl(${h1} 88% 58% / 0.85), transparent 70%)`,
      `radial-gradient(65% 50% at ${b}, hsl(${h2} 90% 62% / 0.7), transparent 72%)`,
      `radial-gradient(60% 45% at ${c}, hsl(${h0} 95% 64% / 0.6), transparent 70%)`,
      `linear-gradient(${angle}deg, hsl(${h0} 55% 14%), hsl(${h1} 58% 20%) 55%, hsl(${h2} 50% 12%))`,
    ];
    return { gradient: layers.join(", "), ink: "light", hue };
  }

  const layers = [
    `radial-gradient(75% 55% at ${a}, hsl(${h1} 92% 74% / 0.85), transparent 70%)`,
    `radial-gradient(65% 50% at ${b}, hsl(${h2} 95% 80% / 0.75), transparent 72%)`,
    `radial-gradient(60% 45% at ${c}, hsl(${h0} 100% 82% / 0.65), transparent 70%)`,
    `linear-gradient(${angle}deg, hsl(${h0} 85% 92%), hsl(${h1} 85% 86%))`,
  ];
  return { gradient: layers.join(", "), ink: "dark", hue };
}
