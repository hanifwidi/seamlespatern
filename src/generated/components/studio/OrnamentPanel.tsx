import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileUp, Shapes, Trash2, X } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@components/ui/empty';
import { Spinner } from '@components/ui/spinner';
import { thumbSvg } from '@generated/lib/svgOut';
import type { Studio } from '@generated/hooks/useStudio';
import { LibraryDialog } from '@generated/components/studio/LibraryDialog';
import { MONO, Panel } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';

export function OrnamentPanel({ studio }: { studio: Studio }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const thumbs = useMemo(
    () =>
      studio.ornaments.map((o) => `data:image/svg+xml;utf8,${encodeURIComponent(thumbSvg(o, '#e8e2d6'))}`),
    [studio.ornaments],
  );

  async function onPick(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const res = await studio.addSvgFiles(Array.from(files));
      if (res.added) toast.success(`${res.added} ornamen masuk`);
      if (res.failed.length) toast.error(`Gagal dibaca: ${res.failed.join(', ')}`);
    } catch (err) {
      console.error('addSvgFiles failed', err);
      toast.error('Import gagal, coba berkas SVG lain');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <Panel
      step="01"
      title="Ornamen"
      note={studio.ornaments.length ? `${studio.activeCount}/${studio.ornaments.length} aktif` : undefined}
      action={
        <>
          {studio.ornaments.length > 0 && (
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Hapus semua ornamen"
              onClick={() => studio.clearOrnaments()}
            >
              <Trash2 />
            </Button>
          )}
          <LibraryDialog studio={studio} />
          <Button size="xs" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Spinner /> : <FileUp />}
            Import SVG
          </Button>
        </>
      }
    >
      <input
        ref={input}
        type="file"
        accept=".svg,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => void onPick(e.target.files)}
      />

      {studio.ornaments.length === 0 ? (
        <Empty className="border border-border bg-[hsl(var(--surface-1))] p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Shapes />
            </EmptyMedia>
            <EmptyTitle className="text-sm">Belum ada ornamen</EmptyTitle>
            <EmptyDescription className="text-xs">
              Masukkan satu atau banyak berkas SVG sekaligus. Bentuknya tetap vektor sampai ekspor.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={() => input.current?.click()}>
                <FileUp />
                Import SVG
              </Button>
              <Button size="sm" variant="outline" onClick={() => studio.addStarters()}>
                Pakai ornamen bawaan
              </Button>
              <Button size="sm" variant="outline" onClick={() => studio.addRandom(8)}>
                Acak 8 motif
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {studio.ornaments.map((o, i) => (
            <div key={o.id} className="group relative">
              <button
                type="button"
                aria-pressed={o.on}
                aria-label={`${o.name} · ${o.on ? 'aktif' : 'nonaktif'}`}
                title={`${o.name} · ${Math.round(o.w)}×${Math.round(o.h)} unit`}
                onClick={() => studio.toggleOrnament(o.id)}
                className={cn(
                  'flex aspect-square w-full items-center justify-center overflow-hidden rounded-sm border p-1.5 transition-colors outline-none focus-visible:ring-[2px] focus-visible:ring-ring',
                  o.on
                    ? 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-2))]'
                    : 'border-border bg-[hsl(var(--surface-1))] opacity-35',
                )}
              >
                <img src={thumbs[i]} alt="" className="h-full max-h-full w-full max-w-full object-contain" />
              </button>
              <button
                type="button"
                aria-label={`Hapus ${o.name}`}
                onClick={() => studio.removeOrnament(o.id)}
                className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-sm border border-border bg-[hsl(var(--surface-3))] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[2px] focus-visible:ring-ring hover:text-foreground max-sm:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {studio.ornaments.length > 0 && studio.activeCount === 0 && (
        <p className={cn(MONO, 'text-[10px] text-[hsl(var(--destructive))]')}>
          Semua ornamen nonaktif: nyalakan minimal satu.
        </p>
      )}
    </Panel>
  );
}
