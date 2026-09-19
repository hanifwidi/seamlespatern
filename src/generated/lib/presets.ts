export type CanvasPreset = { id: string; label: string; w: number; h: number };

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: 'a4', label: 'A4', w: 210, h: 297 },
  { id: 'a3', label: 'A3', w: 297, h: 420 },
  { id: 'sq500', label: '500 mm', w: 500, h: 500 },
];

export const JPG_PRESETS = [
  { px: 2048, label: '2K' },
  { px: 4096, label: '4K' },
  { px: 6144, label: '6K' },
  { px: 8192, label: '8K' },
];

/** Pixel size of a JPG export: `long` is applied to the longest edge. */
export function pixelSize(wMm: number, hMm: number, long: number): { w: number; h: number } {
  const max = Math.max(wMm, hMm);
  return { w: Math.round((wMm / max) * long), h: Math.round((hMm / max) * long) };
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — settings just won't persist */
  }
}
