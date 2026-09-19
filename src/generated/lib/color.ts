const cut = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));

export function toRgb(hex: string): [number, number, number] {
  const s = hex.replace('#', '');
  const f = s.length === 3 ? `${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}` : s.slice(0, 6).padEnd(6, '0');
  return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0];
}

export function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => cut(v).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hh = (((h % 360) + 360) % 360) / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const conv = (t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [conv(hh + 1 / 3) * 255, conv(hh) * 255, conv(hh - 1 / 3) * 255];
}

/** Rotates the hue and optionally re-weights saturation and lightness — one colourway into another. */
export function shiftHue(hex: string, deg: number, satMul = 1, lightMul = 1): string {
  const [r, g, b] = toRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const out = hslToRgb(h + deg, Math.max(0, Math.min(1, s * satMul)), Math.max(0.04, Math.min(0.96, l * lightMul)));
  return toHex(out[0], out[1], out[2]);
}

/** Mixes a colour toward soft paper — used to derive a background that still belongs to the palette. */
export function softTint(hex: string, amount = 0.86): string {
  const [r, g, b] = toRgb(hex);
  const k = Math.max(0, Math.min(1, amount));
  return toHex(r + (247 - r) * k, g + (244 - g) * k, b + (236 - b) * k);
}

/** Coarse colour key: near-identical colours collapse to the same bucket for similarity checks. */
export function bucket(hex: string): string {
  const [r, g, b] = toRgb(hex);
  return [r, g, b].map((v) => Math.round(v / 40)).join('-');
}
