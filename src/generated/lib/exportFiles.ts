export function safeName(raw: string): string {
  const clean = raw
    .trim()
    .replace(/\.(eps|jpg|jpeg|svg)$/i, '')
    .replace(/[^\w\-. ]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
  return clean || 'seamless-pattern';
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function svgUrl(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
}

/** Rasterises tile markup to a JPEG/PNG blob at an exact pixel size. */
export async function rasterize(
  svg: string,
  pxW: number,
  pxH: number,
  bg: string,
  type: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.94,
): Promise<Blob> {
  const url = svgUrl(svg);
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Gambar gagal dirender di browser ini'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, pxW, pxH);
    ctx.drawImage(img, 0, 0, pxW, pxH);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob) throw new Error('Ukuran terlalu besar untuk browser ini');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function textBlob(text: string, type: string): Blob {
  return new Blob([text], { type });
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}`));
    reader.readAsText(file);
  });
}
