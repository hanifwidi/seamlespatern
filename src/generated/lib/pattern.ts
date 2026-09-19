export type LayoutMode = 'scatter' | 'grid' | 'brick';
export type RotMode = 'none' | 'quarter' | 'free';
export type Recolor = 'original' | 'palette';

export type Settings = {
  canvas: string;
  wMm: number;
  hMm: number;
  bg: string;
  mode: LayoutMode;
  count: number;
  sizeMm: number;
  spacingMm: number;
  randomSize: boolean;
  minPct: number;
  maxPct: number;
  rot: RotMode;
  jitter: number;
  recolor: Recolor;
  seed: number;
};

export const DEFAULT_SETTINGS: Settings = {
  canvas: 'a4',
  wMm: 210,
  hMm: 297,
  bg: '#f4f1ea',
  mode: 'scatter',
  count: 42,
  sizeMm: 34,
  spacingMm: 26,
  randomSize: true,
  minPct: 60,
  maxPct: 120,
  rot: 'free',
  jitter: 18,
  recolor: 'palette',
  seed: 8241,
};

export type Placement = {
  o: number;
  x: number;
  y: number;
  size: number;
  rot: number;
  color: string | null;
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function torusDist(ax: number, ay: number, bx: number, by: number, w: number, h: number): number {
  let dx = Math.abs(ax - bx);
  let dy = Math.abs(ay - by);
  if (dx > w / 2) dx = w - dx;
  if (dy > h / 2) dy = h - dy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Builds the placement list for one tile. Positions wrap on a torus, so every
 * placement is later drawn on both sides of each edge for a seam-free repeat.
 */
export function generatePlacements(ids: number[], s: Settings, palette: string[]): Placement[] {
  if (!ids.length) return [];
  const rnd = mulberry32(Math.max(1, Math.floor(s.seed)));
  const W = s.wMm;
  const H = s.hMm;
  const pickId = (): number => ids[Math.floor(rnd() * ids.length)] ?? ids[0] ?? 0;
  const pickSize = (): number => {
    if (!s.randomSize) return s.sizeMm;
    const lo = Math.min(s.minPct, s.maxPct) / 100;
    const hi = Math.max(s.minPct, s.maxPct) / 100;
    return s.sizeMm * (lo + rnd() * (hi - lo));
  };
  const pickRot = (): number => (s.rot === 'free' ? rnd() * 360 : s.rot === 'quarter' ? Math.floor(rnd() * 4) * 90 : 0);
  const pickColor = (): string | null =>
    s.recolor === 'palette' && palette.length ? palette[Math.floor(rnd() * palette.length)] ?? null : null;

  const out: Placement[] = [];
  const target = Math.max(1, Math.round(s.count));

  if (s.mode === 'scatter') {
    const minD = Math.max(0, s.spacingMm);
    let guard = 0;
    const cap = target * 80 + 400;
    while (out.length < target && guard < cap) {
      guard += 1;
      const x = rnd() * W;
      const y = rnd() * H;
      if (minD > 0 && out.some((p) => torusDist(p.x, p.y, x, y, W, H) < minD)) continue;
      out.push({ o: pickId(), x, y, size: pickSize(), rot: pickRot(), color: pickColor() });
    }
    return out;
  }

  const cols = Math.max(1, Math.round(Math.sqrt((target * W) / H)));
  const rows = Math.max(1, Math.round(target / cols));
  const cw = W / cols;
  const ch = H / rows;
  const jf = Math.max(0, Math.min(100, s.jitter)) / 100;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shift = s.mode === 'brick' && r % 2 === 1 ? 0.5 : 0;
      let x = (c + 0.5 + shift) * cw + (rnd() - 0.5) * cw * jf;
      let y = (r + 0.5) * ch + (rnd() - 0.5) * ch * jf;
      x = ((x % W) + W) % W;
      y = ((y % H) + H) % H;
      out.push({ o: pickId(), x, y, size: pickSize(), rot: pickRot(), color: pickColor() });
    }
  }
  return out;
}
