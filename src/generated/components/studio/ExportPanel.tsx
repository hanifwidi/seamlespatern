import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileCode2, FileImage, PackageCheck } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Spinner } from '@components/ui/spinner';
import { useHotkey } from '@generated/hooks/useHotkey';
import { buildEps, validateEps } from '@generated/lib/epsOut';
import { download, safeName, textBlob, rasterize } from '@generated/lib/exportFiles';
import { JPG_PRESETS, pixelSize } from '@generated/lib/presets';
import { buildTileSvg } from '@generated/lib/svgOut';
import type { Studio } from '@generated/hooks/useStudio';
import { MONO, Panel, Row, Segmented } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';
import { AlertTriangle } from 'lucide-react';

type Job = 'both' | 'eps' | 'jpg' | 'svg';

export function ExportPanel({ studio }: { studio: Studio }) {
  const [long, setLong] = useState('4096');
  const [job, setJob] = useState<Job | null>(null);
  const px = pixelSize(studio.settings.wMm, studio.settings.hMm, Number(long));
  const risky = studio.archive.score >= studio.archive.limit && studio.archive.rival !== null;

  async function run(kind: Job) {
    const tile = studio.currentTile();
    if (!tile.placements.length) {
      toast.error('Belum ada ornamen aktif untuk diekspor');
      return;
    }
    setJob(kind);
    const name = safeName(studio.fileName);
    const { wMm, hMm, bg } = tile.settings;
    const base = { ornaments: tile.ornaments, placements: tile.placements, wMm, hMm, bg, recolor: tile.recolor };
    try {
      if (kind === 'eps' || kind === 'both') {
        const eps = buildEps({ ...base, title: name });
        const problems = validateEps(eps);
        if (problems.length) throw new Error(`EPS tidak lolos pemeriksaan: ${problems.join(', ')}`);
        download(textBlob(eps, 'application/postscript'), `${name}.eps`);
      }
      if (kind === 'jpg' || kind === 'both') {
        const svg = buildTileSvg({ ...base, pxW: px.w, pxH: px.h });
        download(await rasterize(svg, px.w, px.h, bg, 'image/jpeg', 0.94), `${name}.jpg`);
      }
      if (kind === 'svg') {
        download(textBlob(buildTileSvg(base), 'image/svg+xml'), `${name}.svg`);
      }
      toast.success(
        kind === 'both' ? `${name}.eps + ${name}.jpg tersimpan` : `${name}.${kind} tersimpan`,
      );
      if (kind !== 'svg') studio.afterExport(name);
    } catch (err) {
      console.error('export failed', err);
      toast.error(err instanceof Error ? err.message : 'Export gagal, coba resolusi lebih kecil');
    } finally {
      setJob(null);
    }
  }

  useHotkey('e', () => void run('both'), job === null);

  return (
    <Panel step="06" title="Export" note="nama berkas sama">
      {risky && (
        <p className="flex items-start gap-2 border border-[hsl(var(--destructive))]/50 bg-[hsl(var(--destructive))]/10 p-2 text-[11px] leading-snug text-foreground">
          <AlertTriangle className="mt-px size-3.5 shrink-0 text-[hsl(var(--destructive))]" />
          Kemiripan {studio.archive.score}% dengan {studio.archive.rival}. Pakai Buat variasi baru di panel Variasi
          sebelum unggah.
        </p>
      )}
      <Row label="Nama berkas">
        <Input
          aria-label="Nama berkas export"
          value={studio.fileName}
          onChange={(e) => studio.setFileName(e.target.value)}
          className={cn(MONO, 'h-8 min-w-0 flex-1 px-2 text-[16px] sm:text-xs')}
        />
      </Row>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-muted-foreground">Resolusi JPG</span>
          <span className={cn(MONO, 'text-[11px] tabular-nums')}>
            {px.w} × {px.h} px
          </span>
        </div>
        <Segmented
          label="Resolusi JPG"
          value={long}
          options={JPG_PRESETS.map((p) => ({ value: String(p.px), label: p.label }))}
          onChange={setLong}
        />
      </div>

      <Button className="w-full" disabled={job !== null} onClick={() => void run('both')}>
        {job === 'both' ? <Spinner /> : <PackageCheck />}
        Export EPS + JPG
      </Button>

      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" disabled={job !== null} onClick={() => void run('eps')}>
          {job === 'eps' ? <Spinner /> : <FileCode2 />}
          EPS
        </Button>
        <Button size="sm" variant="outline" disabled={job !== null} onClick={() => void run('jpg')}>
          {job === 'jpg' ? <Spinner /> : <FileImage />}
          JPG
        </Button>
        <Button size="sm" variant="outline" disabled={job !== null} onClick={() => void run('svg')}>
          {job === 'svg' ? <Spinner /> : <Download />}
          SVG
        </Button>
      </div>

      <ul className={cn(MONO, 'space-y-1 border-t border-border pt-2 text-[10px] text-muted-foreground')}>
        <li>EPS · vektor penuh, artboard 4096 px, siap upload microstock.</li>
        <li>JPG · raster sampai 8K, kualitas 94.</li>
        <li>SVG · cadangan vektor untuk diedit ulang.</li>
      </ul>
    </Panel>
  );
}
