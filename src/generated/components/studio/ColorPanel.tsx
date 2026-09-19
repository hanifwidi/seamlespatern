import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Palette, RotateCcw, X } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import type { Recolor } from '@generated/lib/pattern';
import type { Studio } from '@generated/hooks/useStudio';
import { MONO, Panel, Segmented } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';

export function ColorPanel({ studio }: { studio: Studio }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const n = await studio.loadPaletteFile(file);
      toast.success(`${n} warna dari ${file.name}`);
    } catch (err) {
      console.error('palette import failed', err);
      toast.error(err instanceof Error ? err.message : 'Palet gagal dibaca');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <Panel
      step="04"
      title="Warna"
      note={`${studio.palette.length} warna`}
      action={
        <>
          <Button size="icon-xs" variant="ghost" aria-label="Pulihkan palet bawaan" onClick={() => studio.resetPalette()}>
            <RotateCcw />
          </Button>
          <Button size="xs" variant="outline" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Spinner /> : <Palette />}
            Import palet
          </Button>
        </>
      }
    >
      <input
        ref={input}
        type="file"
        accept=".txt,.css,.json,.gpl,.svg,.scss,.less,text/plain"
        className="hidden"
        onChange={(e) => void onPick(e.target.files)}
      />

      <Segmented<Recolor>
        label="Sumber warna ornamen"
        value={studio.settings.recolor}
        options={[
          { value: 'original', label: 'Warna asli SVG' },
          { value: 'palette', label: 'Pakai palet' },
        ]}
        onChange={(v) => studio.patch({ recolor: v })}
      />

      {studio.palette.length === 0 ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Belum ada palet. Import berkas hasil download (.txt, .css, .json, .gpl, .svg): semua kode warna di dalamnya
          akan terbaca.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {studio.palette.map((hex) => (
            <div key={hex} className="group relative">
              <button
                type="button"
                title={`${hex} · klik untuk jadikan latar`}
                aria-label={`Jadikan ${hex} warna latar`}
                onClick={() => studio.patch({ bg: hex })}
                className={cn(
                  'size-9 rounded-sm border outline-none focus-visible:ring-[2px] focus-visible:ring-ring sm:size-7',
                  studio.settings.bg.toLowerCase() === hex.toLowerCase()
                    ? 'border-primary'
                    : 'border-[hsl(var(--border-strong))]',
                )}
                style={{ backgroundColor: hex }}
              />
              <button
                type="button"
                aria-label={`Buang warna ${hex}`}
                onClick={() => studio.removeColor(hex)}
                className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-sm border border-border bg-[hsl(var(--surface-3))] text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[2px] focus-visible:ring-ring max-sm:opacity-100"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className={cn(MONO, 'text-[10px] leading-relaxed text-muted-foreground')}>
        Klik swatch = jadikan warna latar kanvas.
      </p>
    </Panel>
  );
}
