import { useEffect, useRef, useState } from 'react';
import { cn } from '@lib/utils';
import { useHotkey } from '@generated/hooks/useHotkey';
import type { Studio } from '@generated/hooks/useStudio';
import { MONO, Segmented } from '@generated/components/studio/parts';

const GUTTER = 14;

function Ruler({ axis, mm, px }: { axis: 'x' | 'y'; mm: number; px: number }) {
  const scale = px / mm;
  const step = scale * 10 < 5 ? 50 : 10;
  const ticks: number[] = [];
  for (let v = 0; v <= mm + 0.01; v += step) ticks.push(v);
  const long = (v: number) => (v % (step * 5) === 0 ? GUTTER : GUTTER * 0.45);
  return (
    <svg
      aria-hidden="true"
      width={axis === 'x' ? px : GUTTER}
      height={axis === 'x' ? GUTTER : px}
      className="text-[hsl(var(--grid-line))]"
    >
      {ticks.map((v) => {
        const p = v * scale;
        return axis === 'x' ? (
          <line key={v} x1={p} y1={GUTTER - long(v)} x2={p} y2={GUTTER} stroke="currentColor" strokeWidth={1} />
        ) : (
          <line key={v} x1={GUTTER - long(v)} y1={p} x2={GUTTER} y2={p} stroke="currentColor" strokeWidth={1} />
        );
      })}
    </svg>
  );
}

function Marks() {
  const pos = ['-top-px -left-px', '-top-px -right-px', '-bottom-px -left-px', '-bottom-px -right-px'];
  return (
    <>
      {pos.map((p) => (
        <span key={p} className={cn('pointer-events-none absolute size-2.5', p)} aria-hidden="true">
          <span className="absolute top-1/2 left-0 h-px w-full bg-[hsl(var(--primary))]" />
          <span className="absolute top-0 left-1/2 h-full w-px bg-[hsl(var(--primary))]" />
        </span>
      ))}
    </>
  );
}

export function PatternPreview({ studio }: { studio: Studio }) {
  const { settings, previewUrl, rendering, placedCount, edgeCount } = studio;
  const [rep, setRep] = useState('2');
  const [seams, setSeams] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useHotkey('1', () => setRep('1'));
  useHotkey('2', () => setRep('2'));
  useHotkey('3', () => setRep('3'));
  useHotkey('g', () => setSeams((v) => !v));

  const n = Number(rep);
  const avail = { w: Math.max(0, box.w - GUTTER - 8), h: Math.max(0, box.h - GUTTER - 8) };
  const scale = Math.min(avail.w / (settings.wMm * n), avail.h / (settings.hMm * n));
  const frameW = Math.max(0, Math.floor(settings.wMm * n * scale));
  const frameH = Math.max(0, Math.floor(settings.hMm * n * scale));
  const ready = frameW > 8 && frameH > 8 && previewUrl;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-9 shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-[hsl(var(--surface-1))] px-3">
        <span className={cn(MONO, 'shrink-0 text-[11px] tabular-nums')}>
          {Math.round(settings.wMm)} × {Math.round(settings.hMm)} mm
        </span>
        <span className="shrink-0 text-border">|</span>
        <span className={cn(MONO, 'shrink-0 text-[10px] text-muted-foreground')}>{placedCount} ornamen</span>
        <span
          title="Motif yang melewati tepi tile dan digambar ulang di sisi berlawanan"
          className={cn(
            MONO,
            'shrink-0 text-[10px]',
            edgeCount > 0 ? 'text-muted-foreground' : 'text-[hsl(var(--chart-3))]',
          )}
        >
          {edgeCount} lewat tepi
        </span>
        {rendering && <output className={cn(MONO, 'shrink-0 text-[10px] text-primary')}>merangkai…</output>}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-pressed={seams}
            onClick={() => setSeams((v) => !v)}
            className={cn(
              'rounded-sm border px-2 py-1 text-[10px] transition-colors outline-none focus-visible:ring-[2px] focus-visible:ring-ring',
              seams
                ? 'border-primary/60 bg-primary/10 text-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:bg-[hsl(var(--surface-2))]',
            )}
          >
            garis sambungan
          </button>
          <div className="w-[132px]">
            <Segmented
              label="Jumlah ulangan"
              value={rep}
              options={[
                { value: '1', label: '1×' },
                { value: '2', label: '2×2' },
                { value: '3', label: '3×3' },
              ]}
              onChange={setRep}
            />
          </div>
        </div>
      </header>

      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden p-1">
        <div className="grid h-full w-full place-items-center">
          {ready ? (
            <figure
              className="grid gap-0"
              style={{ gridTemplateColumns: `${GUTTER}px ${frameW}px`, gridTemplateRows: `${GUTTER}px ${frameH}px` }}
            >
              <span aria-hidden="true" />
              <Ruler axis="x" mm={settings.wMm * n} px={frameW} />
              <Ruler axis="y" mm={settings.hMm * n} px={frameH} />
              <div
                className="relative border border-[hsl(var(--border-strong))]"
                style={{
                  width: frameW,
                  height: frameH,
                  backgroundImage: `url(${previewUrl})`,
                  backgroundSize: `${frameW / n}px ${frameH / n}px`,
                  backgroundRepeat: 'repeat',
                }}
              >
                <Marks />
                {seams &&
                  n > 1 &&
                  Array.from({ length: n - 1 }, (_, i) => i + 1).map((i) => (
                    <span key={`s${i}`} aria-hidden="true">
                      <span
                        className="pointer-events-none absolute top-0 h-full w-px bg-primary/45"
                        style={{ left: (frameW / n) * i }}
                      />
                      <span
                        className="pointer-events-none absolute left-0 h-px w-full bg-primary/45"
                        style={{ top: (frameH / n) * i }}
                      />
                    </span>
                  ))}
                {placedCount === 0 && (
                  <div className="absolute inset-0 grid place-items-center bg-background/80 p-4 text-center">
                    <p className="max-w-[24ch] text-xs text-muted-foreground">
                      Aktifkan minimal satu ornamen di panel Ornamen untuk mulai menyusun pola.
                    </p>
                  </div>
                )}
              </div>
              <figcaption className="sr-only">
                {`Pratinjau pola seamless ${Math.round(settings.wMm)} × ${Math.round(
                  settings.hMm,
                )} mm, diulang ${n} × ${n}, ${placedCount} ornamen per tile.`}
              </figcaption>
            </figure>
          ) : (
            <div className="h-3/4 w-1/2 animate-pulse rounded-sm border border-border bg-[hsl(var(--surface-1))]" />
          )}
        </div>
      </div>

      <footer className={cn(MONO, 'flex h-8 shrink-0 items-center gap-3 border-t border-border px-3 text-[10px] text-muted-foreground')}>
        <span>seed {settings.seed}</span>
        <span>
          {settings.mode === 'scatter' ? 'acak' : settings.mode} · {settings.rot === 'free' ? 'rotasi bebas' : settings.rot === 'quarter' ? 'rotasi 90°' : 'tanpa rotasi'}
        </span>
        <span className="ml-auto truncate">tepi kanvas selalu tersambung, tanpa cacat</span>
      </footer>
    </div>
  );
}
