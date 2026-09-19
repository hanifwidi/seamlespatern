import { fmt, isHold, type Ornament, type Prim, type Seg } from '@generated/lib/geom';
import type { Placement } from '@generated/lib/pattern';

export function pathD(segs: Seg[]): string {
  const parts: string[] = [];
  for (const s of segs) {
    if (s.c === 'Z') {
      parts.push('Z');
      continue;
    }
    parts.push(s.c + s.v.map((n) => fmt(n)).join(' '));
  }
  return parts.join('');
}

/**
 * `colorable = true` leaves painted fills/strokes unset so they inherit the colour
 * set on the <use> element (palette recolouring); unpainted parts stay explicit.
 */
export function primEls(prims: Prim[], colorable: boolean, hold?: string): string {
  const paint = (c: string): string | null => (isHold(c) ? hold ?? c : colorable ? null : c);
  return prims
    .map((p) => {
      const attrs: string[] = [`d="${pathD(p.segs)}"`];
      if (p.fill) {
        const v = paint(p.fill);
        if (v) attrs.push(`fill="${v}"`);
      } else attrs.push('fill="none"');
      if (p.stroke) {
        const v = paint(p.stroke);
        if (v) attrs.push(`stroke="${v}"`);
        attrs.push(`stroke-width="${fmt(p.sw)}"`, 'stroke-linejoin="round"', 'stroke-linecap="round"');
      } else attrs.push('stroke="none"');
      if (p.rule === 'evenodd') attrs.push('fill-rule="evenodd"');
      if (p.alpha < 1) attrs.push(`fill-opacity="${fmt(p.alpha)}"`);
      return `<path ${attrs.join(' ')}/>`;
    })
    .join('');
}

export function thumbSvg(o: Ornament, color = '#1c1a18', hold = '#1c1a18'): string {
  const pad = Math.max(o.w, o.h) * 0.06;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(-pad)} ${fmt(-pad)} ${fmt(o.w + pad * 2)} ${fmt(
    o.h + pad * 2,
  )}"><g fill="${color}" stroke="${color}">${primEls(o.prims, true, hold)}</g></svg>`;
}

export type TileInput = {
  ornaments: Ornament[];
  placements: Placement[];
  wMm: number;
  hMm: number;
  bg: string;
  recolor: boolean;
  pxW?: number;
  pxH?: number;
};

/** Renders one seamless tile as standalone SVG markup (vector at any output size). */
export function buildTileSvg(t: TileInput): string {
  const used = Array.from(new Set(t.placements.map((p) => p.o))).filter((i) => t.ornaments[i]);
  const defs = used
    .map((i) => {
      const o = t.ornaments[i];
      if (!o) return '';
      return `<g id="orn${i}">${primEls(o.prims, t.recolor, t.bg)}</g>`;
    })
    .join('');

  const body: string[] = [];
  for (const p of t.placements) {
    const o = t.ornaments[p.o];
    if (!o) continue;
    const k = p.size / Math.max(o.w, o.h);
    const r = (Math.max(o.w, o.h) * k * Math.SQRT2) / 2;
    const paint = t.recolor && p.color ? ` fill="${p.color}" stroke="${p.color}"` : '';
    for (const dx of [-t.wMm, 0, t.wMm]) {
      for (const dy of [-t.hMm, 0, t.hMm]) {
        const x = p.x + dx;
        const y = p.y + dy;
        if (x + r < 0 || x - r > t.wMm || y + r < 0 || y - r > t.hMm) continue;
        const tf = `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(p.rot)}) scale(${fmt(k)}) translate(${fmt(
          -o.w / 2,
        )} ${fmt(-o.h / 2)})`;
        body.push(`<use href="#orn${p.o}" xlink:href="#orn${p.o}" transform="${tf}"${paint}/>`);
      }
    }
  }

  const w = t.pxW ?? Math.round(t.wMm * 4);
  const h = t.pxH ?? Math.round(t.hMm * 4);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${fmt(
      t.wMm,
    )} ${fmt(t.hMm)}" shape-rendering="geometricPrecision">`,
    `<defs><clipPath id="tile"><rect x="0" y="0" width="${fmt(t.wMm)}" height="${fmt(t.hMm)}"/></clipPath>${defs}</defs>`,
    `<rect x="0" y="0" width="${fmt(t.wMm)}" height="${fmt(t.hMm)}" fill="${t.bg}"/>`,
    `<g clip-path="url(#tile)">${body.join('')}</g>`,
    '</svg>',
  ].join('');
}
