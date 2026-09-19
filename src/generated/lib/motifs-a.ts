import type { Prim } from '@generated/lib/geom';
import {
  INK,
  PAPER,
  type Pt,
  arcPts,
  dot,
  fillPath,
  line,
  oval,
  petal,
  poly,
  prim,
  rng,
  strokePath,
  wavePts,
} from '@generated/lib/shapes';

/* ── botani ─────────────────────────────────────────────────────────── */

export function rosette(petals: number, core = 9): Prim[] {
  const out: Prim[] = [];
  const wide = Math.max(6, 110 / petals);
  for (let i = 0; i < petals; i++) out.push(prim(petal(50, 50, 44, wide, (i * 360) / petals), INK));
  out.push(dot(50, 50, core, PAPER));
  return out;
}

export function leafVein(w: number, veins: number): Prim[] {
  const out: Prim[] = [
    prim(
      [
        { c: 'M', v: [50, 3] },
        { c: 'C', v: [50 + w, 30, 50 + w, 68, 50, 97] },
        { c: 'C', v: [50 - w, 68, 50 - w, 30, 50, 3] },
        { c: 'Z', v: [] },
      ],
      INK,
    ),
    line([50, 12, 50, 90], 2.4, PAPER),
  ];
  for (let i = 1; i <= veins; i++) {
    const t = i / (veins + 1);
    const y = 18 + t * 64;
    const sp = (1 - Math.abs(t - 0.4)) * w * 0.7;
    out.push(line([50, y + 9, 50 - sp, y], 1.6, PAPER), line([50, y + 9, 50 + sp, y], 1.6, PAPER));
  }
  return out;
}

export function sprig(pairs: number, bud: boolean): Prim[] {
  const out: Prim[] = [strokePath(arcPts(78, 50, 30, -1.75, -0.35, 10), 3.4)];
  for (let i = 0; i < pairs; i++) {
    const t = i / Math.max(1, pairs - 0.2);
    const y = 82 - t * 52;
    const len = 30 - t * 11;
    out.push(prim(petal(50 + t * 3, y, len, len * 0.3, -32 - t * 8), INK));
    out.push(prim(petal(50 + t * 3, y, len, len * 0.3, -148 + t * 8), INK));
  }
  if (bud) out.push(prim(petal(50, 26, 22, 9, -90), INK), dot(50, 12, 6, INK));
  return out;
}

export function fern(fronds: number): Prim[] {
  const out: Prim[] = [strokePath([[46, 96], [50, 70], [52, 40], [50, 8]], 2.6)];
  for (let i = 0; i < fronds; i++) {
    const t = i / fronds;
    const y = 90 - t * 78;
    const len = 34 * (1 - t * 0.72);
    out.push(prim(petal(50, y, len, len * 0.22, -20 - t * 20), INK));
    out.push(prim(petal(50, y, len, len * 0.22, -160 + t * 20), INK));
  }
  return out;
}

export function tulip(): Prim[] {
  return [
    prim(petal(50, 58, 40, 15, -90), INK),
    prim(petal(50, 58, 33, 13, -138), INK),
    prim(petal(50, 58, 33, 13, -42), INK),
    line([50, 58, 50, 97], 3, INK),
    prim(petal(50, 84, 22, 8, -18), INK),
  ];
}

export function seedPod(seeds: number): Prim[] {
  const out: Prim[] = [oval(50, 50, 22, 40, INK)];
  for (let i = 0; i < seeds; i++) {
    const y = 20 + ((i + 0.5) / seeds) * 60;
    out.push(oval(50, y, 9, 7, PAPER));
  }
  return out;
}

export function berryBranch(berries: number): Prim[] {
  const out: Prim[] = [strokePath([[50, 97], [52, 70], [48, 40], [50, 10]], 2.8)];
  for (let i = 0; i < berries; i++) {
    const t = (i + 0.5) / berries;
    const side = i % 2 === 0 ? -1 : 1;
    out.push(dot(50 + side * (10 + t * 16), 86 - t * 66, 9 - t * 2, INK));
    out.push(line([50, 86 - t * 66, 50 + side * (10 + t * 16), 86 - t * 66], 1.8, INK));
  }
  return out;
}

export function wheat(grains: number): Prim[] {
  const out: Prim[] = [line([50, 97, 50, 34], 2.6, INK)];
  for (let i = 0; i < grains; i++) {
    const y = 78 - (i / grains) * 66;
    out.push(prim(petal(50, y, 19, 6.5, -46), INK), prim(petal(50, y, 19, 6.5, -134), INK));
  }
  out.push(prim(petal(50, 20, 17, 6, -90), INK));
  return out;
}

export function palmFan(blades: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < blades; i++) {
    const a = -165 + (i / (blades - 1)) * 150;
    out.push(prim(petal(50, 92, 62 - Math.abs(i - (blades - 1) / 2) * 6, 7, a), INK));
  }
  out.push(line([50, 92, 50, 99], 4, INK));
  return out;
}

/* ── organik ────────────────────────────────────────────────────────── */

export function blobShape(seed: number, lobes: number): Prim[] {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const rad = 28 + r() * 20;
    pts.push([50 + rad * Math.cos(a), 50 + rad * Math.sin(a)]);
  }
  return [fillPath(pts, INK)];
}

export function pebbles(seed: number, count: number): Prim[] {
  const r = rng(seed);
  const out: Prim[] = [];
  for (let i = 0; i < count; i++) {
    const cx = 22 + r() * 56;
    const cy = 22 + r() * 56;
    const rad = 9 + r() * 12;
    const pts: Pt[] = [];
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const rr = rad * (0.72 + r() * 0.5);
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    out.push(fillPath(pts, INK));
  }
  return out;
}

export function squiggle(turns: number): Prim[] {
  return [strokePath(wavePts(4, 50, 92, 26, turns, 36), 7)];
}

export function spiralCoil(turns: number): Prim[] {
  const pts: Pt[] = [];
  const steps = Math.round(turns * 26);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const rad = 6 + t * 40;
    pts.push([50 + rad * Math.cos(a), 50 + rad * Math.sin(a)]);
  }
  return [strokePath(pts, 5.5)];
}

export function terrazzo(seed: number, chips: number): Prim[] {
  const r = rng(seed);
  const out: Prim[] = [];
  for (let i = 0; i < chips; i++) {
    const cx = 20 + r() * 60;
    const cy = 20 + r() * 60;
    const rad = 11 + r() * 14;
    const sides = 3 + Math.floor(r() * 3);
    const pts: number[] = [];
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2 + r() * 0.6;
      pts.push(cx + rad * Math.cos(a), cy + rad * (0.8 + r() * 0.4) * Math.sin(a));
    }
    out.push(poly(pts, INK));
  }
  return out;
}

export function brushStroke(bend: number): Prim[] {
  const pts: Pt[] = [
    [10, 76],
    [32, 76 - bend],
    [58, 28 + bend],
    [88, 26],
  ];
  return [strokePath(pts, 11)];
}
