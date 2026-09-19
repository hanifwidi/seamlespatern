import type { Seg } from '@generated/lib/geom';

/** Converts an elliptical arc to a list of cubic segments (each: c1x c1y c2x c2y x y). */
function arcToCubic(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  phiDeg: number,
  large: number,
  sweep: number,
  x2: number,
  y2: number,
): number[][] {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx < 1e-9 || ry < 1e-9) return [[x1, y1, x2, y2, x2, y2]];
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) {
    const s = Math.sqrt(lam);
    rx *= s;
    ry *= s;
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = (large !== sweep ? 1 : -1) * Math.sqrt(Math.max(num / den, 0));
  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number): number => {
    const d = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy)) || 1;
    let a = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / d)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;
  let t1 = ang(1, 0, ux, uy);
  let dt = ang(ux, uy, vx, vy);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const parts = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2)));
  const step = dt / parts;
  const k = (4 / 3) * Math.tan(step / 4);
  const out: number[][] = [];
  const pt = (t: number): [number, number] => [
    cx + rx * cosP * Math.cos(t) - ry * sinP * Math.sin(t),
    cy + rx * sinP * Math.cos(t) + ry * cosP * Math.sin(t),
  ];
  const dr = (t: number): [number, number] => [
    -rx * cosP * Math.sin(t) - ry * sinP * Math.cos(t),
    -rx * sinP * Math.sin(t) + ry * cosP * Math.cos(t),
  ];
  for (let i = 0; i < parts; i++) {
    const a1 = t1 + i * step;
    const a2 = a1 + step;
    const [px, py] = pt(a1);
    const [qx, qy] = pt(a2);
    const [d1x, d1y] = dr(a1);
    const [d2x, d2y] = dr(a2);
    out.push([px + k * d1x, py + k * d1y, qx - k * d2x, qy - k * d2y, qx, qy]);
  }
  t1 += dt;
  return out;
}

const TOKENS = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;

/** Parses an SVG path `d` attribute into absolute M/L/C/Z segments. */
export function parsePath(d: string): Seg[] {
  const toks: string[] = [];
  TOKENS.lastIndex = 0;
  let t: RegExpExecArray | null = TOKENS.exec(d);
  while (t) {
    toks.push(t[0]);
    t = TOKENS.exec(d);
  }
  const out: Seg[] = [];
  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let lcx = 0;
  let lcy = 0;
  let prev = '';
  const num = (): number => {
    const v = Number(toks[i++] ?? '0');
    return Number.isFinite(v) ? v : 0;
  };
  const flag = (): number => {
    const raw = toks[i] ?? '0';
    if (raw.length > 1 && (raw[0] === '0' || raw[0] === '1')) {
      toks[i] = raw.slice(1);
      return raw[0] === '1' ? 1 : 0;
    }
    i++;
    return Number(raw) ? 1 : 0;
  };
  while (i < toks.length) {
    const tok = toks[i];
    if (tok && /[A-Za-z]/.test(tok)) {
      cmd = tok;
      i++;
      if (cmd === 'Z' || cmd === 'z') {
        out.push({ c: 'Z', v: [] });
        cx = sx;
        cy = sy;
        prev = 'Z';
        continue;
      }
    }
    if (!cmd) {
      i++;
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? cx : 0;
    const oy = rel ? cy : 0;
    const key = cmd.toUpperCase();
    if (key === 'M') {
      const x = num() + ox;
      const y = num() + oy;
      out.push({ c: 'M', v: [x, y] });
      cx = x;
      cy = y;
      sx = x;
      sy = y;
      cmd = rel ? 'l' : 'L';
      prev = 'M';
    } else if (key === 'L') {
      const x = num() + ox;
      const y = num() + oy;
      out.push({ c: 'L', v: [x, y] });
      cx = x;
      cy = y;
      prev = 'L';
    } else if (key === 'H') {
      const x = num() + ox;
      out.push({ c: 'L', v: [x, cy] });
      cx = x;
      prev = 'L';
    } else if (key === 'V') {
      const y = num() + oy;
      out.push({ c: 'L', v: [cx, y] });
      cy = y;
      prev = 'L';
    } else if (key === 'C' || key === 'S') {
      let x1: number;
      let y1: number;
      if (key === 'C') {
        x1 = num() + ox;
        y1 = num() + oy;
      } else {
        x1 = prev === 'C' ? 2 * cx - lcx : cx;
        y1 = prev === 'C' ? 2 * cy - lcy : cy;
      }
      const x2 = num() + ox;
      const y2 = num() + oy;
      const x = num() + ox;
      const y = num() + oy;
      out.push({ c: 'C', v: [x1, y1, x2, y2, x, y] });
      lcx = x2;
      lcy = y2;
      cx = x;
      cy = y;
      prev = 'C';
    } else if (key === 'Q' || key === 'T') {
      let qx: number;
      let qy: number;
      if (key === 'Q') {
        qx = num() + ox;
        qy = num() + oy;
      } else {
        qx = prev === 'Q' ? 2 * cx - lcx : cx;
        qy = prev === 'Q' ? 2 * cy - lcy : cy;
      }
      const x = num() + ox;
      const y = num() + oy;
      out.push({
        c: 'C',
        v: [cx + (2 / 3) * (qx - cx), cy + (2 / 3) * (qy - cy), x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x, y],
      });
      lcx = qx;
      lcy = qy;
      cx = x;
      cy = y;
      prev = 'Q';
    } else if (key === 'A') {
      const rx = num();
      const ry = num();
      const rot = num();
      const la = flag();
      const sw = flag();
      const x = num() + ox;
      const y = num() + oy;
      for (const c of arcToCubic(cx, cy, rx, ry, rot, la, sw, x, y)) {
        out.push({ c: 'C', v: c });
      }
      cx = x;
      cy = y;
      prev = 'A';
    } else {
      i++;
    }
  }
  return out;
}

const K = 0.5522847498;

export function ellipseSegs(cx: number, cy: number, rx: number, ry: number): Seg[] {
  return [
    { c: 'M', v: [cx + rx, cy] },
    { c: 'C', v: [cx + rx, cy + ry * K, cx + rx * K, cy + ry, cx, cy + ry] },
    { c: 'C', v: [cx - rx * K, cy + ry, cx - rx, cy + ry * K, cx - rx, cy] },
    { c: 'C', v: [cx - rx, cy - ry * K, cx - rx * K, cy - ry, cx, cy - ry] },
    { c: 'C', v: [cx + rx * K, cy - ry, cx + rx, cy - ry * K, cx + rx, cy] },
    { c: 'Z', v: [] },
  ];
}

export function polySegs(pts: number[], close: boolean): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i + 1 < pts.length; i += 2) {
    out.push({ c: i === 0 ? 'M' : 'L', v: [pts[i] ?? 0, pts[i + 1] ?? 0] });
  }
  if (close && out.length > 1) out.push({ c: 'Z', v: [] });
  return out;
}

export function rectSegs(x: number, y: number, w: number, h: number, rx: number, ry: number): Seg[] {
  const a = Math.min(rx || ry, w / 2);
  const b = Math.min(ry || rx, h / 2);
  if (a <= 0 || b <= 0) return polySegs([x, y, x + w, y, x + w, y + h, x, y + h], true);
  return [
    { c: 'M', v: [x + a, y] },
    { c: 'L', v: [x + w - a, y] },
    { c: 'C', v: [x + w - a + a * K, y, x + w, y + b - b * K, x + w, y + b] },
    { c: 'L', v: [x + w, y + h - b] },
    { c: 'C', v: [x + w, y + h - b + b * K, x + w - a + a * K, y + h, x + w - a, y + h] },
    { c: 'L', v: [x + a, y + h] },
    { c: 'C', v: [x + a - a * K, y + h, x, y + h - b + b * K, x, y + h - b] },
    { c: 'L', v: [x, y + b] },
    { c: 'C', v: [x, y + b - b * K, x + a - a * K, y, x + a, y] },
    { c: 'Z', v: [] },
  ];
}
