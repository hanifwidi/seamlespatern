import { fmt, isHold, type Ornament, type Prim, type Seg } from '@generated/lib/geom';
import { rgbTuple } from '@generated/lib/palette';
import type { Placement } from '@generated/lib/pattern';

function col(hex: string): string {
  const [r, g, b] = rgbTuple(hex);
  return `${fmt(r)} ${fmt(g)} ${fmt(b)} setrgbcolor `;
}

function segsPs(segs: Seg[]): string {
  const out: string[] = [];
  for (const s of segs) {
    if (s.c === 'Z') out.push('closepath');
    else if (s.c === 'M') out.push(`${fmt(s.v[0] ?? 0)} ${fmt(s.v[1] ?? 0)} moveto`);
    else if (s.c === 'L') out.push(`${fmt(s.v[0] ?? 0)} ${fmt(s.v[1] ?? 0)} lineto`);
    else out.push(`${s.v.map((n) => fmt(n)).join(' ')} curveto`);
  }
  return out.join(' ');
}

function primPs(p: Prim, colorable: boolean, hold?: string): string {
  const fillOp = p.rule === 'evenodd' ? 'eofill' : 'fill';
  const sw = fmt(Math.max(0.01, p.sw));
  const paint = (c: string): string => (isHold(c) ? col(hold ?? c) : colorable ? '' : col(c));
  const lines = [`newpath ${segsPs(p.segs)}`];
  if (p.fill && p.stroke) {
    lines.push(`gsave ${paint(p.fill)}${fillOp} grestore`);
    lines.push(`${paint(p.stroke)}${sw} setlinewidth stroke`);
  } else if (p.fill) {
    lines.push(`${paint(p.fill)}${fillOp}`);
  } else if (p.stroke) {
    lines.push(`${paint(p.stroke)}${sw} setlinewidth stroke`);
  }
  const body = lines.join('\n');
  // A cut-out sets an explicit colour, so isolate it or the next shape inherits it.
  return colorable && (isHold(p.fill) || isHold(p.stroke)) ? `gsave\n${body}\ngrestore` : body;
}

export type EpsInput = {
  ornaments: Ornament[];
  placements: Placement[];
  wMm: number;
  hMm: number;
  bg: string;
  recolor: boolean;
  title: string;
  artboardPx?: number;
};

/**
 * Structural self-check run before every download. It cannot replace opening the file in
 * Illustrator, but it catches the failures that silently produce an unopenable EPS.
 */
export function validateEps(text: string): string[] {
  const bad: string[] = [];
  if (!text.startsWith('%!PS-Adobe-3.0 EPSF-3.0')) bad.push('header EPSF hilang');
  if (!/^%%BoundingBox: 0 0 \d+ \d+$/m.test(text)) bad.push('BoundingBox tidak valid');
  if (!text.trimEnd().endsWith('%%EOF')) bad.push('penutup %%EOF hilang');
  if (!text.includes('moveto')) bad.push('tidak ada jalur vektor');
  const saves = text.match(/\bgsave\b/g)?.length ?? 0;
  const restores = text.match(/\bgrestore\b/g)?.length ?? 0;
  if (saves !== restores) bad.push(`gsave/grestore tidak seimbang (${saves}/${restores})`);
  if (/NaN|Infinity|undefined|null/.test(text)) bad.push('ada angka tidak valid');
  // eslint-disable-next-line no-control-regex
  if (/[^\x09\x0a\x0d\x20-\x7e]/.test(text)) bad.push('ada karakter non-ASCII');
  return bad;
}

/**
 * Writes a real vector EPS (Level 2 PostScript): every ornament becomes a reusable
 * procedure, every placement a transformed call, and edge pieces are repeated on the
 * opposite side so the artboard stays seamless.
 */
export function buildEps(e: EpsInput): string {
  const long = e.artboardPx ?? 4096;
  const s = long / Math.max(e.wMm, e.hMm);
  const wPt = e.wMm * s;
  const hPt = e.hMm * s;
  const used = Array.from(new Set(e.placements.map((p) => p.o))).filter((i) => e.ornaments[i]);

  const procs = used
    .map((i) => {
      const o = e.ornaments[i];
      if (!o) return '';
      return `/orn${i} {\n${o.prims.map((p) => primPs(p, e.recolor, e.bg)).join('\n')}\n} bind def`;
    })
    .join('\n');

  const calls: string[] = [];
  for (const p of e.placements) {
    const o = e.ornaments[p.o];
    if (!o) continue;
    const k = p.size / Math.max(o.w, o.h);
    const r = (Math.max(o.w, o.h) * k * Math.SQRT2) / 2;
    const paint = e.recolor && p.color ? col(p.color) : '';
    for (const dx of [-e.wMm, 0, e.wMm]) {
      for (const dy of [-e.hMm, 0, e.hMm]) {
        const x = p.x + dx;
        const y = p.y + dy;
        if (x + r < 0 || x - r > e.wMm || y + r < 0 || y - r > e.hMm) continue;
        calls.push(
          `gsave ${paint}${fmt(x)} ${fmt(y)} translate ${fmt(p.rot)} rotate ${fmt(k)} ${fmt(k)} scale ${fmt(
            -o.w / 2,
          )} ${fmt(-o.h / 2)} translate orn${p.o} grestore`,
        );
      }
    }
  }

  return [
    '%!PS-Adobe-3.0 EPSF-3.0',
    '%%Creator: Ornamen Press (offline seamless pattern studio)',
    `%%Title: ${e.title}`,
    `%%CreationDate: ${new Date().toISOString()}`,
    `%%BoundingBox: 0 0 ${Math.ceil(wPt)} ${Math.ceil(hPt)}`,
    `%%HiResBoundingBox: 0 0 ${fmt(wPt)} ${fmt(hPt)}`,
    '%%DocumentData: Clean7Bit',
    '%%LanguageLevel: 2',
    '%%Pages: 1',
    '%%EndComments',
    '%%BeginProlog',
    '%%EndProlog',
    '%%Page: 1 1',
    'gsave',
    `0 ${fmt(hPt)} translate`,
    `${fmt(s)} ${fmt(-s)} scale`,
    procs,
    `newpath 0 0 moveto ${fmt(e.wMm)} 0 lineto ${fmt(e.wMm)} ${fmt(e.hMm)} lineto 0 ${fmt(e.hMm)} lineto closepath clip`,
    `${col(e.bg)}0 0 ${fmt(e.wMm)} ${fmt(e.hMm)} rectfill`,
    calls.join('\n'),
    'grestore',
    'showpage',
    '%%Trailer',
    '%%EOF',
    '',
  ].join('\n');
}
