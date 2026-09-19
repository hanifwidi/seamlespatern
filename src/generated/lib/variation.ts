import type { Ornament } from '@generated/lib/geom';
import type { LayoutMode, RotMode, Settings } from '@generated/lib/pattern';
import { bucket, shiftHue, softTint } from '@generated/lib/color';

/** Compact signature of one finished design — what a stock reviewer actually compares. */
export type Print = {
  motifs: string[];
  colors: string[];
  mode: string;
  rot: string;
  density: number;
  size: number;
  spacing: number;
  bg: string;
};

export type HistEntry = { name: string; at: number; fp: Print };
export type Level = 'ketat' | 'normal' | 'longgar';

export const LIMIT: Record<Level, number> = { ketat: 38, normal: 52, longgar: 66 };

export function fingerprint(orn: Ornament[], s: Settings, palette: string[]): Print {
  const area = Math.max(0.5, (s.wMm * s.hMm) / 10000);
  return {
    motifs: orn.filter((o) => o.on).map((o) => o.name).sort(),
    colors: (s.recolor === 'palette' ? palette : []).map(bucket).sort(),
    mode: s.mode,
    rot: s.rot,
    density: s.count / area,
    size: s.sizeMm,
    spacing: s.spacingMm,
    bg: bucket(s.bg),
  };
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 1;
  const B = new Set(b);
  let inter = 0;
  for (const v of new Set(a)) if (B.has(v)) inter += 1;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 1;
}

const near = (a: number, b: number, scale: number): number => 1 - Math.min(1, Math.abs(a - b) / Math.max(0.001, scale));

/** 0 = nothing in common, 100 = effectively the same file. */
export function similarity(a: Print, b: Print): number {
  const raw =
    0.34 * jaccard(a.motifs, b.motifs) +
    0.22 * jaccard(a.colors, b.colors) +
    0.1 * (a.mode === b.mode ? 1 : 0) +
    0.06 * (a.rot === b.rot ? 1 : 0) +
    0.1 * near(a.density, b.density, Math.max(2, (a.density + b.density) / 2)) +
    0.08 * near(a.size, b.size, 20) +
    0.05 * near(a.spacing, b.spacing, 26) +
    0.05 * (a.bg === b.bg ? 1 : 0);
  return Math.round(raw * 100);
}

export function worstMatch(fp: Print, hist: HistEntry[]): { score: number; name: string } | null {
  let out: { score: number; name: string } | null = null;
  for (const h of hist) {
    const score = similarity(fp, h.fp);
    if (!out || score > out.score) out = { score, name: h.name };
  }
  return out;
}

export type Proposal = { settings: Settings; onIds: string[]; palette: string[]; changed: string[]; score: number };

const MODES: LayoutMode[] = ['scatter', 'grid', 'brick'];
const ROTS: RotMode[] = ['none', 'quarter', 'free'];
const pick = <T,>(arr: T[], fallback: T): T => arr[Math.floor(Math.random() * arr.length)] ?? fallback;

function subset(orn: Ornament[]): string[] {
  const pool = [...orn].sort(() => Math.random() - 0.5);
  const size = Math.max(1, Math.min(pool.length, 2 + Math.floor(Math.random() * 4)));
  return pool.slice(0, size).map((o) => o.id);
}

function nextPalette(palette: string[]): string[] {
  if (palette.length < 2) return palette;
  const shuffled = [...palette].sort(() => Math.random() - 0.5);
  const keep = Math.max(2, Math.min(shuffled.length, 3 + Math.floor(Math.random() * 3)));
  const cut = shuffled.slice(0, keep);
  if (Math.random() < 0.55) return cut;
  const deg = (Math.random() < 0.5 ? -1 : 1) * (22 + Math.random() * 46);
  return cut.map((c) => shiftHue(c, deg, 0.85 + Math.random() * 0.4, 0.9 + Math.random() * 0.25));
}

function candidate(orn: Ornament[], s: Settings, palette: string[]): Omit<Proposal, 'score'> {
  const onIds = subset(orn);
  const nextPal = nextPalette(palette);
  const size = 18 + Math.round(Math.random() * 34);
  const mode = pick(MODES, 'scatter');
  const settings: Settings = {
    ...s,
    mode,
    rot: pick(ROTS, 'free'),
    count: 14 + Math.round(Math.random() * 78),
    sizeMm: size,
    spacingMm: Math.round(size * (mode === 'scatter' ? 0.55 + Math.random() * 0.55 : 0.2 + Math.random() * 0.4)),
    randomSize: Math.random() < 0.72,
    minPct: 50 + Math.round(Math.random() * 25),
    maxPct: 105 + Math.round(Math.random() * 55),
    jitter: Math.round(Math.random() * 40),
    bg: softTint(nextPal[0] ?? s.bg, 0.74 + Math.random() * 0.2),
    seed: Math.floor(Math.random() * 99999) + 1,
  };
  const before = orn.filter((o) => o.on).map((o) => o.id).sort().join();
  const changed: string[] = [];
  if (onIds.slice().sort().join() !== before) changed.push('motif');
  if (settings.mode !== s.mode) changed.push('susunan');
  if (Math.abs(settings.count - s.count) > 6) changed.push('kepadatan');
  if (Math.abs(settings.sizeMm - s.sizeMm) > 4) changed.push('skala');
  if (nextPal.join() !== palette.join()) changed.push('warna');
  if (settings.rot !== s.rot) changed.push('rotasi');
  return { settings, onIds, palette: nextPal, changed };
}

/**
 * Searches the design space for a layout that scores below the chosen similarity limit
 * against everything already archived, changing motif mix, colourway, density and rotation
 * together — not just the seed.
 */
export function proposeVariation(
  orn: Ornament[],
  s: Settings,
  palette: string[],
  hist: HistEntry[],
  level: Level,
): Proposal {
  const limit = LIMIT[level];
  let best: Proposal | null = null;
  for (let i = 0; i < 60; i++) {
    const cand = candidate(orn, s, palette);
    const onSet = new Set(cand.onIds);
    const marked = orn.map((o) => ({ ...o, on: onSet.has(o.id) }));
    const score = worstMatch(fingerprint(marked, cand.settings, cand.palette), hist)?.score ?? 0;
    if (!best || score < best.score) best = { ...cand, score };
    if (score < limit) break;
  }
  return best ?? { settings: s, onIds: orn.map((o) => o.id), palette, changed: [], score: 100 };
}

/** seamless-ornamen-01 → seamless-ornamen-02, so a batch never overwrites itself. */
export function bumpName(name: string): string {
  const m = /^(.*?)(\d+)(\D*)$/.exec(name.trim());
  if (!m) return `${name.trim() || 'seamless'}-02`;
  const digits = m[2] ?? '1';
  const next = String(Number(digits) + 1).padStart(digits.length, '0');
  return `${m[1] ?? ''}${next}${m[3] ?? ''}`;
}
