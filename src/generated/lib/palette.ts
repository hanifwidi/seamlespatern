const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
const RGB = /rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/g;
const GPL_LINE = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\b/;

function hex2(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

function norm(h: string): string {
  const s = h.toLowerCase();
  return s.length === 4 ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}` : s;
}

/**
 * Pulls colours out of a downloaded palette file: .txt / .css / .json / .svg hex lists,
 * rgb() lists, or GIMP .gpl triplets.
 */
export function extractColors(text: string, limit = 48): string[] {
  const found: string[] = [];
  const push = (c: string) => {
    if (!found.includes(c) && found.length < limit) found.push(c);
  };
  if (/GIMP Palette/i.test(text)) {
    for (const line of text.split(/\r?\n/)) {
      const m = GPL_LINE.exec(line);
      if (m) push(`#${hex2(Number(m[1]))}${hex2(Number(m[2]))}${hex2(Number(m[3]))}`);
    }
    if (found.length) return found;
  }
  HEX.lastIndex = 0;
  let h: RegExpExecArray | null = HEX.exec(text);
  while (h) {
    push(norm(h[0]));
    h = HEX.exec(text);
  }
  RGB.lastIndex = 0;
  let r: RegExpExecArray | null = RGB.exec(text);
  while (r) {
    push(`#${hex2(Number(r[1]))}${hex2(Number(r[2]))}${hex2(Number(r[3]))}`);
    r = RGB.exec(text);
  }
  return found;
}

/** Relative luminance, used to keep readable text on top of a swatch. */
export function isLight(hexColor: string): boolean {
  const s = hexColor.replace('#', '');
  const r = parseInt(s.slice(0, 2), 16) / 255;
  const g = parseInt(s.slice(2, 4), 16) / 255;
  const b = parseInt(s.slice(4, 6), 16) / 255;
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.45;
}

export function rgbTuple(hexColor: string): [number, number, number] {
  const s = hexColor.replace('#', '');
  return [
    parseInt(s.slice(0, 2), 16) / 255 || 0,
    parseInt(s.slice(2, 4), 16) / 255 || 0,
    parseInt(s.slice(4, 6), 16) / 255 || 0,
  ];
}
