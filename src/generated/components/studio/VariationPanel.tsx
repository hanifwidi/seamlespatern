import { toast } from 'sonner';
import { Dices, Eraser, Shuffle } from 'lucide-react';
import { Button } from '@components/ui/button';
import { useHotkey } from '@generated/hooks/useHotkey';
import type { Studio } from '@generated/hooks/useStudio';
import type { Level } from '@generated/lib/variation';
import { MONO, Panel, Segmented } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';

const LEVELS: { value: Level; label: string }[] = [
  { value: 'ketat', label: 'Ketat' },
  { value: 'normal', label: 'Normal' },
  { value: 'longgar', label: 'Longgar' },
];

export function VariationPanel({ studio }: { studio: Studio }) {
  const { archive } = studio;
  const risky = archive.score >= archive.limit;
  const warm = !risky && archive.score >= archive.limit - 12;
  const tone = risky ? 'text-[hsl(var(--destructive))]' : warm ? 'text-[hsl(var(--chart-3))]' : 'text-primary';
  const recent = archive.entries.slice(0, 3);

  function roll() {
    const p = studio.newVariation();
    if (!p) {
      toast.error('Tambah ornamen dulu sebelum membuat variasi');
      return;
    }
    const axes = p.changed.length ? p.changed.join(', ') : 'seed';
    if (p.score >= archive.limit) {
      toast.warning(`Masih mirip ${p.score}%. Tambah motif baru dari galeri atau ganti palet.`);
    } else {
      toast.success(`Variasi baru · ${p.score}% mirip · ganti ${axes}`);
    }
  }

  useHotkey('v', roll);

  return (
    <Panel
      step="05"
      title="Variasi"
      note={`${archive.entries.length} berkas terarsip`}
      action={
        archive.entries.length > 0 ? (
          <Button size="icon-xs" variant="ghost" aria-label="Kosongkan arsip" onClick={() => archive.clear()}>
            <Eraser />
          </Button>
        ) : undefined
      }
    >
      <div className="border border-border bg-[hsl(var(--surface-2))] p-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className={cn(MONO, 'text-[10px] tracking-[0.14em] text-muted-foreground uppercase')}>
              kemiripan tertinggi
            </p>
            <p className={cn(MONO, 'text-3xl leading-none font-light tabular-nums', tone)}>{archive.score}%</p>
          </div>
          <p className="min-w-0 text-right text-[10px] leading-tight text-muted-foreground">
            {archive.rival ? (
              <>
                vs <span className={cn(MONO, 'text-foreground')}>{archive.rival}</span>
              </>
            ) : (
              'arsip masih kosong'
            )}
            <br />
            batas aman {archive.limit}%
          </p>
        </div>
        <div className="mt-2 h-1 w-full bg-[hsl(var(--surface-3))]">
          <div
            className={cn('h-full', risky ? 'bg-[hsl(var(--destructive))]' : warm ? 'bg-[hsl(var(--chart-3))]' : 'bg-primary')}
            style={{ width: `${Math.min(100, archive.score)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {risky
            ? 'Terlalu dekat dengan berkas yang sudah diekspor. Ganti campuran motif dan warnanya sebelum upload.'
            : 'Aman untuk diunggah sebagai karya terpisah dari arsip di perangkat ini.'}
        </p>
      </div>

      <Segmented label="Ketat kemiripan" value={archive.level} options={LEVELS} onChange={archive.setLevel} />

      <Button className="w-full" onClick={roll}>
        <Shuffle />
        Buat variasi baru
      </Button>
      <Button size="sm" variant="outline" className="w-full" onClick={() => studio.reseed()}>
        <Dices />
        Acak posisi saja
      </Button>

      {recent.length > 0 && (
        <ul className="space-y-1 border-t border-border pt-2">
          {recent.map((e) => (
            <li key={e.at} className="flex items-center gap-2">
              <span className={cn(MONO, 'min-w-0 flex-1 truncate text-[10px] text-muted-foreground')}>{e.name}</span>
              <button
                type="button"
                aria-label={`Hapus ${e.name} dari arsip`}
                onClick={() => archive.forget(e.at)}
                className="shrink-0 text-[10px] text-muted-foreground underline-offset-2 outline-none hover:text-foreground focus-visible:underline"
              >
                hapus
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className={cn(MONO, 'text-[10px] leading-relaxed text-muted-foreground')}>
        Setiap export dicatat di perangkat ini, lalu nama berkas naik satu nomor otomatis.
      </p>
    </Panel>
  );
}
