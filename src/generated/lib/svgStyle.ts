/** Style, CSS and colour resolution for the offline SVG importer. */
export type Style = Record<string, string>;

export const STYLE_ATTRS = [
  'fill',
  'stroke',
  'stroke-width',
  'fill-rule',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'display',
  'visibility',
];

const colorCache = new Map<string, string>();
let gradients = new Map<string, string>();

function hex(n: number): string {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, '0');
}

function fromRgbList(list: string): string {
  const p = list.split(/[\s,/]+/).map((n) => Number(n));
  return `#${hex(p[0] ?? 0)}${hex(p[1] ?? 0)}${hex(p[2] ?? 0)}`;
}

/** Normalises any CSS colour string to #rrggbb. null means "not painted". */
export function resolveColor(raw: string | null | undefined, fallback: string | null): string | null {
  if (raw === undefined || raw === null) return fallback;
  const s = raw.trim().toLowerCase();
  if (!s || s === 'none' || s === 'transparent') return null;
  if (s.startsWith('url(')) {
    const id = /url\(\s*['"]?#([^'")\s]+)/.exec(s)?.[1];
    // A gradient or pattern cannot be reproduced as flat vector art: fall back to its first stop.
    return (id ? gradients.get(id) : null) ?? '#8a8a8a';
  }
  if (s === 'currentcolor') return '#000000';
  if (/^#[0-9a-f]{3}$/.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  const cached = colorCache.get(s);
  if (cached) return cached;
  let out = '#000000';
  const rgb = /rgba?\(([^)]+)\)/.exec(s);
  if (rgb) out = fromRgbList(rgb[1] ?? '');
  else if (typeof document !== 'undefined') {
    try {
      const el = document.createElement('span');
      el.style.color = s;
      el.style.display = 'none';
      document.body.appendChild(el);
      const computed = getComputedStyle(el).color;
      document.body.removeChild(el);
      const m = /rgba?\(([^)]+)\)/.exec(computed);
      if (m) out = fromRgbList(m[1] ?? '');
    } catch {
      out = '#000000';
    }
  }
  colorCache.set(s, out);
  return out;
}

export function parseDecls(src: string | null | undefined, into: Style): Style {
  if (!src) return into;
  for (const part of src.split(';')) {
    const idx = part.indexOf(':');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();
    if (key && val) into[key] = val;
  }
  return into;
}

export type Rule = { sel: string; decls: Style };

export function cssRules(doc: Document): Rule[] {
  const rules: Rule[] = [];
  const blocks = /([^{}]+)\{([^{}]+)\}/g;
  doc.querySelectorAll('style').forEach((node) => {
    const text = node.textContent ?? '';
    blocks.lastIndex = 0;
    let hit: RegExpExecArray | null = blocks.exec(text);
    while (hit) {
      const decls = parseDecls(hit[2] ?? '', {});
      for (const sel of (hit[1] ?? '').split(',')) {
        const clean = sel.trim();
        if (clean && !clean.startsWith('@')) rules.push({ sel: clean, decls });
      }
      hit = blocks.exec(text);
    }
  });
  return rules;
}

/** Records the first stop of every gradient so `fill="url(#id)"` keeps a related colour. */
export function indexGradients(doc: Document): void {
  gradients = new Map<string, string>();
  doc.querySelectorAll('linearGradient,radialGradient').forEach((g) => {
    const id = g.getAttribute('id');
    if (!id) return;
    const stop = g.querySelector('stop');
    const raw =
      stop?.getAttribute('stop-color') ?? parseDecls(stop?.getAttribute('style'), {})['stop-color'] ?? null;
    const c = resolveColor(raw, null);
    if (c) gradients.set(id, c);
  });
}

/** Presentation attributes, then matching CSS rules, then the inline style attribute. */
export function resolveStyle(el: Element, inherited: Style, rules: Rule[]): Style {
  const style: Style = { ...inherited };
  for (const a of STYLE_ATTRS) {
    const v = el.getAttribute(a);
    if (v) style[a] = v;
  }
  for (const rule of rules) {
    try {
      if (el.matches(rule.sel)) Object.assign(style, rule.decls);
    } catch {
      /* selector shapes we cannot match are ignored */
    }
  }
  return parseDecls(el.getAttribute('style'), style);
}
