import type { Prim } from '@generated/lib/geom';
import {
  INK,
  PAPER,
  type Pt,
  arcPts,
  crescent,
  dot,
  line,
  oval,
  petal,
  poly,
  prim,
  regularPoly,
  ringOf,
  starSegs,
  strokePath,
} from '@generated/lib/shapes';

/* ── geometris ──────────────────────────────────────────────────────── */

export function nestedDiamond(layers: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < layers; i++) {
    const r = 48 - i * (40 / layers);
    out.push(poly([50, 50 - r, 50 + r, 50, 50, 50 + r, 50 - r, 50], i % 2 === 0 ? INK : PAPER));
  }
  return out;
}

export function chevron(rows: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < rows; i++) {
    const y = 20 + (i * 60) / rows;
    out.push(strokePath([[8, y + 22], [50, y], [92, y + 22]] as Pt[], 7.5));
  }
  return out;
}

export function hexWeb(inner: boolean): Prim[] {
  const out: Prim[] = [poly(regularPoly(50, 50, 46, 6), null, INK, 5)];
  if (inner) out.push(poly(regularPoly(50, 50, 24, 6, Math.PI / 6), INK));
  else out.push(poly(regularPoly(50, 50, 26, 6), null, INK, 3.5));
  return out;
}

export function arcStack(count: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < count; i++) {
    out.push(strokePath(arcPts(50, 74, 14 + i * (32 / count), Math.PI, Math.PI * 2, 12), 6));
  }
  return out;
}

export function lattice(cells: number): Prim[] {
  const out: Prim[] = [];
  const step = 100 / cells;
  for (let i = 0; i <= cells; i++) {
    out.push(line([i * step, 0, i * step, 100], 3.2, INK));
    out.push(line([0, i * step, 100, i * step], 3.2, INK));
  }
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r + c) % 2 === 0) out.push(dot((c + 0.5) * step, (r + 0.5) * step, step * 0.16, INK));
    }
  }
  return out;
}

export function stepPyramid(steps: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < steps; i++) {
    const w = 92 - i * (72 / steps);
    const h = 88 / steps;
    out.push(poly([50 - w / 2, 92 - i * h, 50 + w / 2, 92 - i * h, 50 + w / 2, 92 - (i + 1) * h, 50 - w / 2, 92 - (i + 1) * h], i % 2 === 0 ? INK : PAPER));
  }
  return out;
}

/* ── etnik ──────────────────────────────────────────────────────────── */

export function kawung(): Prim[] {
  return [
    oval(50, 22, 17, 22, INK),
    oval(50, 78, 17, 22, INK),
    oval(22, 50, 22, 17, INK),
    oval(78, 50, 22, 17, INK),
    dot(50, 50, 8, INK),
  ];
}

export function parang(slashes: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < slashes; i++) {
    const off = (i * 100) / slashes;
    out.push(strokePath([[off - 22, 100], [off + 14, 58], [off + 18, 26], [off + 44, 0]] as Pt[], 10));
    out.push(dot(off + 8, 76, 4.5, INK), dot(off + 20, 40, 4.5, INK));
  }
  return out;
}

export function ceplok(points: number): Prim[] {
  const out: Prim[] = [prim(starSegs(50, 50, points, 46, 20), INK), ringOf(50, 50, 30, 2.6, PAPER), dot(50, 50, 8, PAPER)];
  for (let i = 0; i < points; i++) {
    const a = (i * Math.PI * 2) / points;
    out.push(dot(50 + 15 * Math.cos(a), 50 + 15 * Math.sin(a), 3, PAPER));
  }
  return out;
}

export function tumpal(teeth: number): Prim[] {
  const out: Prim[] = [];
  const w = 100 / teeth;
  for (let i = 0; i < teeth; i++) {
    out.push(poly([i * w, 96, (i + 0.5) * w, 18, (i + 1) * w, 96], INK));
    out.push(dot((i + 0.5) * w, 62, w * 0.1, PAPER));
  }
  return out;
}

export function megaMendung(turns: number): Prim[] {
  const out: Prim[] = [];
  for (let k = 0; k < turns; k++) {
    const r = 40 - k * (26 / turns);
    out.push(strokePath(arcPts(50, 54, r, Math.PI * 0.92, Math.PI * 2.32, 16), 6.5));
  }
  out.push(strokePath(arcPts(50, 54, 9, 0, Math.PI * 1.6, 10), 5));
  return out;
}

export function songket(bands: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < bands; i++) {
    const y = 14 + (i * 74) / (bands - 1);
    out.push(line([6, y, 94, y], 3, INK));
    for (let k = 0; k < 4; k++) out.push(poly([14 + k * 24, y - 7, 22 + k * 24, y, 14 + k * 24, y + 7, 6 + k * 24, y], INK));
  }
  return out;
}

/* ── langit ─────────────────────────────────────────────────────────── */

export function crescentStar(): Prim[] {
  return [crescent(46, 52, 38, 15), prim(starSegs(84, 22, 5, 15, 6), INK)];
}

export function sunRays(rays: number): Prim[] {
  const out: Prim[] = [dot(50, 50, 22, INK)];
  for (let i = 0; i < rays; i++) {
    const a = (i * Math.PI * 2) / rays;
    out.push(
      line([50 + 28 * Math.cos(a), 50 + 28 * Math.sin(a), 50 + 46 * Math.cos(a), 50 + 46 * Math.sin(a)], 4.5, INK),
    );
  }
  return out;
}

export function constellation(seed: number, stars: number): Prim[] {
  const pts: Pt[] = [];
  let a = seed * 0.77;
  for (let i = 0; i < stars; i++) {
    a += 1.9 + ((seed * (i + 3)) % 7) * 0.24;
    const rad = 16 + ((seed * (i + 5)) % 11) * 2.6;
    pts.push([50 + rad * Math.cos(a), 50 + rad * Math.sin(a)]);
  }
  const out: Prim[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i] ?? [50, 50];
    const q = pts[i + 1] ?? [50, 50];
    out.push(line([p[0], p[1], q[0], q[1]], 1.6, INK));
  }
  for (const p of pts) out.push(prim(starSegs(p[0], p[1], 4, 9, 2.6), INK));
  return out;
}

export function starBurst(points: number): Prim[] {
  return [prim(starSegs(50, 50, points, 47, points > 5 ? 20 : 17), INK), dot(50, 50, 6, PAPER)];
}

/* ── deko ───────────────────────────────────────────────────────────── */

export function decoFan(blades: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < blades; i++) {
    out.push(strokePath(arcPts(50, 94, 20 + i * (66 / blades), Math.PI, Math.PI * 2, 12), 5.5));
  }
  out.push(dot(50, 94, 7, INK));
  return out;
}

export function steppedArch(steps: number): Prim[] {
  const out: Prim[] = [poly([20, 94, 20, 44, 50, 14, 80, 44, 80, 94], INK)];
  for (let i = 1; i <= steps; i++) {
    const k = i * (26 / (steps + 1));
    out.push(poly([20 + k, 94, 20 + k, 44 + k * 0.6, 50, 14 + k * 1.2, 80 - k, 44 + k * 0.6, 80 - k, 94], i % 2 === 1 ? PAPER : INK));
  }
  return out;
}

export function dangle(drops: number): Prim[] {
  const out: Prim[] = [line([50, 4, 50, 34], 2.4, INK)];
  for (let i = 0; i < drops; i++) {
    const y = 40 + i * (54 / drops);
    const r = 13 - i * (7 / drops);
    out.push(oval(50, y, r, r * 1.5, INK));
  }
  return out;
}

export function deltaFleur(): Prim[] {
  return [
    prim(petal(50, 62, 34, 14, -90), INK),
    prim(petal(50, 62, 27, 11, -30), INK),
    prim(petal(50, 62, 27, 11, -150), INK),
    poly([36, 68, 64, 68, 50, 96], INK),
  ];
}
