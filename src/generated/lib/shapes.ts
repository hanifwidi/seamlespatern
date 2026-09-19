import { HOLD, type Prim, type Seg } from '@generated/lib/geom';
import { ellipseSegs, polySegs } from '@generated/lib/svgPath';

/** Low-level vector builders shared by every built-in motif. Box space is 0..100. */
export const INK = '#1c1a18';
export const PAPER = HOLD;

export type Pt = [number, number];

export function prim(
  segs: Seg[],
  fill: string | null,
  stroke: string | null = null,
  sw = 1,
  rule: 'nonzero' | 'evenodd' = 'nonzero',
): Prim {
  return { segs, fill, stroke, sw, rule, alpha: 1 };
}

export const dot = (cx: number, cy: number, r: number, fill = INK): Prim => prim(ellipseSegs(cx, cy, r, r), fill);

export const ringOf = (cx: number, cy: number, r: number, sw: number, color = INK): Prim =>
  prim(ellipseSegs(cx, cy, r, r), null, color, sw);

export const oval = (cx: number, cy: number, rx: number, ry: number, fill = INK): Prim =>
  prim(ellipseSegs(cx, cy, rx, ry), fill);

export const line = (pts: number[], sw = 3, color = INK): Prim => prim(polySegs(pts, false), null, color, sw);

export const poly = (pts: number[], fill: string | null = INK, stroke: string | null = null, sw = 1): Prim =>
  prim(polySegs(pts, true), fill, stroke, sw);

export function rng(seed: number): () => number {
  let a = (seed | 0) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const at = (pts: Pt[], i: number): Pt => {
  const n = pts.length;
  return pts[((i % n) + n) % n] ?? [0, 0];
};

/** Catmull-Rom through the given points, emitted as cubic segments (closed loop). */
export function smoothClosed(pts: Pt[]): Seg[] {
  if (pts.length < 3) return polySegs(pts.flat(), true);
  const first = at(pts, 0);
  const out: Seg[] = [{ c: 'M', v: [first[0], first[1]] }];
  for (let i = 0; i < pts.length; i++) {
    const p0 = at(pts, i - 1);
    const p1 = at(pts, i);
    const p2 = at(pts, i + 1);
    const p3 = at(pts, i + 2);
    out.push({
      c: 'C',
      v: [
        p1[0] + (p2[0] - p0[0]) / 6,
        p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6,
        p2[1] - (p3[1] - p1[1]) / 6,
        p2[0],
        p2[1],
      ],
    });
  }
  out.push({ c: 'Z', v: [] });
  return out;
}

/** Catmull-Rom through an open run of points (endpoints duplicated). */
export function smoothOpen(pts: Pt[]): Seg[] {
  if (pts.length < 3) return polySegs(pts.flat(), false);
  const g = (i: number): Pt => pts[Math.max(0, Math.min(pts.length - 1, i))] ?? [0, 0];
  const start = g(0);
  const out: Seg[] = [{ c: 'M', v: [start[0], start[1]] }];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = g(i - 1);
    const p1 = g(i);
    const p2 = g(i + 1);
    const p3 = g(i + 2);
    out.push({
      c: 'C',
      v: [
        p1[0] + (p2[0] - p0[0]) / 6,
        p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6,
        p2[1] - (p3[1] - p1[1]) / 6,
        p2[0],
        p2[1],
      ],
    });
  }
  return out;
}

export const strokePath = (pts: Pt[], sw: number, color = INK): Prim => prim(smoothOpen(pts), null, color, sw);

export const fillPath = (pts: Pt[], fill = INK): Prim => prim(smoothClosed(pts), fill);

export function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, steps = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

export function wavePts(x0: number, y0: number, len: number, amp: number, turns: number, steps = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push([x0 + len * t, y0 + amp * Math.sin(t * turns * Math.PI * 2)]);
  }
  return out;
}

export function petal(cx: number, cy: number, len: number, wide: number, angle: number): Seg[] {
  const a = (angle * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const map = (x: number, y: number): Pt => [cx + x * ca - y * sa, cy + x * sa + y * ca];
  const p0 = map(0, 0);
  const c1 = map(len * 0.35, -wide);
  const c2 = map(len * 0.75, -wide * 0.7);
  const tip = map(len, 0);
  const c3 = map(len * 0.75, wide * 0.7);
  const c4 = map(len * 0.35, wide);
  return [
    { c: 'M', v: [p0[0], p0[1]] },
    { c: 'C', v: [c1[0], c1[1], c2[0], c2[1], tip[0], tip[1]] },
    { c: 'C', v: [c3[0], c3[1], c4[0], c4[1], p0[0], p0[1]] },
    { c: 'Z', v: [] },
  ];
}

export function starSegs(cx: number, cy: number, points: number, outer: number, inner: number): Seg[] {
  const pts: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  return polySegs(pts, true);
}

/** Two offset circles with the even-odd rule — a true crescent, no boolean ops needed. */
export function crescent(cx: number, cy: number, r: number, off: number, fill = INK): Prim {
  return prim([...ellipseSegs(cx, cy, r, r), ...ellipseSegs(cx + off, cy - off * 0.4, r * 0.88, r * 0.88)], fill, null, 1, 'evenodd');
}

export function regularPoly(cx: number, cy: number, r: number, sides: number, turn = 0): number[] {
  const pts: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i * Math.PI * 2) / sides - Math.PI / 2 + turn;
    pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  return pts;
}
