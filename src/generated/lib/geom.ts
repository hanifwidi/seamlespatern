/** Flat vector geometry model shared by the SVG importer, the SVG writer and the EPS writer. */
export type Seg = { c: 'M' | 'L' | 'C' | 'Z'; v: number[] };

/** Reserved cut-out colour: when a palette recolours a motif, these parts take the canvas colour. */
export const HOLD = '#f2f0ec';

export const isHold = (c: string | null | undefined): boolean => !!c && c.toLowerCase() === HOLD;

export type Prim = {
  segs: Seg[];
  fill: string | null;
  stroke: string | null;
  sw: number;
  rule: 'nonzero' | 'evenodd';
  alpha: number;
};

export type Ornament = {
  id: string;
  name: string;
  w: number;
  h: number;
  prims: Prim[];
  on: boolean;
};

export type Mat = [number, number, number, number, number, number];

export const IDENT: Mat = [1, 0, 0, 1, 0, 0];

export function mul(a: Mat, b: Mat): Mat {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}

export function matScale(m: Mat): number {
  const det = Math.abs(m[0] * m[3] - m[1] * m[2]);
  return det > 0 ? Math.sqrt(det) : 1;
}

const TRANSFORM_RE = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;

export function parseTransform(src: string | null | undefined): Mat {
  if (!src) return IDENT;
  let out: Mat = IDENT;
  TRANSFORM_RE.lastIndex = 0;
  let hit: RegExpExecArray | null = TRANSFORM_RE.exec(src);
  while (hit) {
    const nums = (hit[2] ?? '')
      .split(/[\s,]+/)
      .filter((t) => t.length > 0)
      .map((t) => Number(t));
    const g = (i: number, d = 0): number => {
      const v = nums[i];
      return typeof v === 'number' && Number.isFinite(v) ? v : d;
    };
    let t: Mat = IDENT;
    if (hit[1] === 'matrix') t = [g(0, 1), g(1), g(2), g(3, 1), g(4), g(5)];
    else if (hit[1] === 'translate') t = [1, 0, 0, 1, g(0), g(1)];
    else if (hit[1] === 'scale') {
      const sx = g(0, 1);
      t = [sx, 0, 0, nums.length > 1 ? g(1, 1) : sx, 0, 0];
    } else if (hit[1] === 'rotate') {
      const a = (g(0) * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      t = mul([1, 0, 0, 1, g(1), g(2)], mul([c, s, -s, c, 0, 0], [1, 0, 0, 1, -g(1), -g(2)]));
    } else if (hit[1] === 'skewX') t = [1, 0, Math.tan((g(0) * Math.PI) / 180), 1, 0, 0];
    else if (hit[1] === 'skewY') t = [1, Math.tan((g(0) * Math.PI) / 180), 0, 1, 0, 0];
    out = mul(out, t);
    hit = TRANSFORM_RE.exec(src);
  }
  return out;
}

export function transformSegs(segs: Seg[], m: Mat): Seg[] {
  if (m === IDENT) return segs;
  return segs.map((s) => {
    const v: number[] = [];
    for (let i = 0; i + 1 < s.v.length; i += 2) {
      const x = s.v[i] ?? 0;
      const y = s.v[i + 1] ?? 0;
      v.push(m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]);
    }
    return { c: s.c, v };
  });
}

export function bboxOf(prims: Prim[]): { x: number; y: number; w: number; h: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of prims) {
    const pad = p.stroke ? p.sw / 2 : 0;
    for (const s of p.segs) {
      for (let i = 0; i + 1 < s.v.length; i += 2) {
        const x = s.v[i] ?? 0;
        const y = s.v[i + 1] ?? 0;
        if (x - pad < x0) x0 = x - pad;
        if (y - pad < y0) y0 = y - pad;
        if (x + pad > x1) x1 = x + pad;
        if (y + pad > y1) y1 = y + pad;
      }
    }
  }
  if (!Number.isFinite(x0) || !Number.isFinite(y0)) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: x0, y: y0, w: Math.max(x1 - x0, 0.001), h: Math.max(y1 - y0, 0.001) };
}

export function shiftPrims(prims: Prim[], dx: number, dy: number): Prim[] {
  return prims.map((p) => ({ ...p, segs: transformSegs(p.segs, [1, 0, 0, 1, dx, dy]) }));
}
