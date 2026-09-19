import {
  IDENT,
  bboxOf,
  mul,
  matScale,
  parseTransform,
  shiftPrims,
  transformSegs,
  type Mat,
  type Ornament,
  type Prim,
  type Seg,
} from '@generated/lib/geom';
import { ellipseSegs, parsePath, polySegs, rectSegs } from '@generated/lib/svgPath';
import { cssRules, indexGradients, resolveColor, resolveStyle, type Rule, type Style } from '@generated/lib/svgStyle';

const SHAPES = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']);
/** Never traversed directly — `defs`/`symbol` content is only reached through <use>. */
const SKIP = new Set([
  'defs',
  'clippath',
  'mask',
  'style',
  'script',
  'title',
  'desc',
  'metadata',
  'filter',
  'symbol',
  'marker',
  'pattern',
  'lineargradient',
  'radialgradient',
  'text',
  'image',
  'foreignobject',
]);
const GROUPS = new Set(['g', 'svg', 'symbol', 'a', 'switch']);
const MAX_PRIMS = 4000;
const MAX_DEPTH = 14;

type Ctx = { rules: Rule[]; byId: Map<string, Element>; out: Prim[] };

function shapeSegs(el: Element): Seg[] | null {
  const tag = el.tagName.toLowerCase();
  const n = (name: string, d = 0): number => {
    const v = parseFloat(el.getAttribute(name) ?? '');
    return Number.isFinite(v) ? v : d;
  };
  if (tag === 'path') return parsePath(el.getAttribute('d') ?? '');
  if (tag === 'rect') return rectSegs(n('x'), n('y'), n('width'), n('height'), n('rx'), n('ry'));
  if (tag === 'circle') return ellipseSegs(n('cx'), n('cy'), n('r'), n('r'));
  if (tag === 'ellipse') return ellipseSegs(n('cx'), n('cy'), n('rx'), n('ry'));
  if (tag === 'line') return polySegs([n('x1'), n('y1'), n('x2'), n('y2')], false);
  if (tag === 'polyline' || tag === 'polygon') {
    const pts = (el.getAttribute('points') ?? '')
      .split(/[\s,]+/)
      .filter((t) => t.length > 0)
      .map((t) => Number(t))
      .filter((v) => Number.isFinite(v));
    return polySegs(pts, tag === 'polygon');
  }
  return null;
}

function emit(el: Element, style: Style, m: Mat, out: Prim[]): void {
  const segs = shapeSegs(el);
  if (!segs || segs.length < 2) return;
  const fill = resolveColor(style['fill'], '#000000');
  const stroke = resolveColor(style['stroke'], null);
  if (!fill && !stroke) return;
  const swRaw = parseFloat(style['stroke-width'] ?? '1');
  const op = parseFloat(style['opacity'] ?? '1');
  const pop = parseFloat(style[fill ? 'fill-opacity' : 'stroke-opacity'] ?? '1');
  out.push({
    segs: transformSegs(segs, m),
    fill,
    stroke,
    sw: (Number.isFinite(swRaw) ? Math.abs(swRaw) : 1) * matScale(m),
    rule: style['fill-rule'] === 'evenodd' ? 'evenodd' : 'nonzero',
    alpha: Math.max(0.05, Math.min(1, (Number.isFinite(op) ? op : 1) * (Number.isFinite(pop) ? pop : 1))),
  });
}

/** Expands a `<use>` reference: pulls the target geometry in with the use element's offset. */
function expandUse(el: Element, style: Style, m: Mat, ctx: Ctx, depth: number): void {
  const ref = (el.getAttribute('href') ?? el.getAttribute('xlink:href') ?? '').trim();
  if (!ref.startsWith('#')) return;
  const target = ctx.byId.get(ref.slice(1));
  if (!target || target === el) return;
  const x = parseFloat(el.getAttribute('x') ?? '0');
  const y = parseFloat(el.getAttribute('y') ?? '0');
  const um = mul(m, [1, 0, 0, 1, Number.isFinite(x) ? x : 0, Number.isFinite(y) ? y : 0]);
  const tag = target.tagName.toLowerCase();
  if (GROUPS.has(tag)) {
    const inner = resolveStyle(target, style, ctx.rules);
    const tm = mul(um, parseTransform(target.getAttribute('transform')));
    for (const child of Array.from(target.children)) walk(child, inner, tm, ctx, depth + 1);
  } else walk(target, style, um, ctx, depth + 1);
}

function walk(el: Element, inherited: Style, matrix: Mat, ctx: Ctx, depth: number): void {
  const tag = el.tagName.toLowerCase();
  if (ctx.out.length >= MAX_PRIMS || depth > MAX_DEPTH || SKIP.has(tag)) return;
  const style = resolveStyle(el, inherited, ctx.rules);
  if (style['display'] === 'none' || style['visibility'] === 'hidden') return;
  const m = mul(matrix, parseTransform(el.getAttribute('transform')));
  if (tag === 'use') {
    expandUse(el, style, m, ctx, depth);
    return;
  }
  if (SHAPES.has(tag)) {
    emit(el, style, m, ctx.out);
    return;
  }
  for (const child of Array.from(el.children)) walk(child, style, m, ctx, depth + 1);
}

let counter = 0;

/** Parses raw SVG markup into a normalised ornament (geometry moved to origin). */
export function importSvgText(text: string, name: string): Ornament {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') throw new Error('Berkas bukan SVG yang valid');
  if (doc.querySelector('parsererror')) throw new Error('Isi SVG rusak dan tidak bisa dibaca');
  const rules = cssRules(doc);
  indexGradients(doc);
  const byId = new Map<string, Element>();
  doc.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id');
    if (id && !byId.has(id)) byId.set(id, el);
  });
  const ctx: Ctx = { rules, byId, out: [] };
  const rootStyle = resolveStyle(root, {}, rules);
  const rootM = mul(IDENT, parseTransform(root.getAttribute('transform')));
  for (const child of Array.from(root.children)) walk(child, rootStyle, rootM, ctx, 0);
  if (!ctx.out.length) throw new Error('SVG tidak punya bentuk vektor yang bisa dibaca');
  const box = bboxOf(ctx.out);
  counter += 1;
  return {
    id: `o${Date.now().toString(36)}${counter}`,
    name: name.replace(/\.svg$/i, '').slice(0, 28) || `ornamen ${counter}`,
    w: box.w,
    h: box.h,
    prims: shiftPrims(ctx.out, -box.x, -box.y),
    on: true,
  };
}

export function ornamentFromPrims(name: string, prims: Prim[]): Ornament {
  const box = bboxOf(prims);
  counter += 1;
  return {
    id: `b${counter}${Date.now().toString(36)}`,
    name,
    w: box.w,
    h: box.h,
    prims: shiftPrims(prims, -box.x, -box.y),
    on: true,
  };
}
