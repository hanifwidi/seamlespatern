import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Library, Plus, Search } from 'lucide-react';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { useHotkey } from '@generated/hooks/useHotkey';
import { LIB_CATS, LIB_COUNT, libraryItems, type LibCat, type LibItem } from '@generated/lib/library';
import { thumbSvg } from '@generated/lib/svgOut';
import type { Studio } from '@generated/hooks/useStudio';
import { MONO } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';

export function LibraryDialog({ studio }: { studio: Studio }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LibItem[]>([]);
  const [cat, setCat] = useState<LibCat | 'semua'>('semua');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (open && items.length === 0) setItems(libraryItems());
  }, [open, items.length]);

  useHotkey('l', () => setOpen(true), !open);

  const thumbs = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      map.set(it.name, `data:image/svg+xml;utf8,${encodeURIComponent(thumbSvg(it, '#e8e2d6'))}`);
    }
    return map;
  }, [items]);

  const term = q.trim().toLowerCase();
  const shown = items.filter((it) => (cat === 'semua' || it.cat === cat) && (!term || it.name.includes(term)));
  const owned = new Set(studio.ornaments.map((o) => o.name));

  function add(names: string[]) {
    const fresh = items
      .filter((it) => names.includes(it.name) && !owned.has(it.name))
      .map((it, i) => ({ ...it, id: `${it.id}-${Date.now().toString(36)}${i}`, on: true }));
    if (!fresh.length) {
      toast.error('Motif itu sudah ada di daftar ornamen');
      return;
    }
    studio.addOrnaments(fresh);
    toast.success(`${fresh.length} motif ditambahkan`);
    setPicked([]);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="xs" variant="outline">
          <Library />
          Galeri
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[88dvh] max-w-3xl flex-col gap-3 overflow-hidden bg-[hsl(var(--surface-1))] p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-light tracking-tight">Galeri motif · {LIB_COUNT} bentuk</DialogTitle>
          <DialogDescription className="text-xs">
            Semua motif dibangun sebagai vektor di perangkat ini. Campur beberapa kategori supaya satu set tidak
            terlihat kembar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[140px] flex-1">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Cari motif"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="cari motif"
              className={cn(MONO, 'h-8 pl-7 text-[16px] sm:text-xs')}
            />
          </div>
          <fieldset aria-label="Kategori motif" className="flex flex-wrap gap-1 [min-inline-size:0]">
            {[{ id: 'semua' as const, label: 'Semua' }, ...LIB_CATS].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={cat === c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  'rounded-sm border px-2 py-1 text-[11px] transition-colors outline-none focus-visible:ring-[2px] focus-visible:ring-ring',
                  cat === c.id
                    ? 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-3))] text-foreground'
                    : 'border-border text-muted-foreground hover:bg-[hsl(var(--surface-2))]',
                )}
              >
                {c.label}
              </button>
            ))}
          </fieldset>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border border-border bg-[hsl(var(--surface-2))] p-2">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {shown.map((it) => {
              const on = picked.includes(it.name);
              return (
                <button
                  key={it.name}
                  type="button"
                  aria-pressed={on}
                  title={owned.has(it.name) ? `${it.name} · sudah dipakai` : it.name}
                  onClick={() => setPicked((p) => (on ? p.filter((n) => n !== it.name) : [...p, it.name]))}
                  className={cn(
                    'relative flex aspect-square items-center justify-center overflow-hidden rounded-sm border p-1.5 transition-colors outline-none focus-visible:ring-[2px] focus-visible:ring-ring',
                    on ? 'border-primary bg-[hsl(var(--surface-3))]' : 'border-border bg-[hsl(var(--surface-1))]',
                    owned.has(it.name) && !on && 'opacity-40',
                  )}
                >
                  <img src={thumbs.get(it.name)} alt={it.name} className="h-full w-full object-contain" />
                </button>
              );
            })}
          </div>
          {shown.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">Tidak ada motif dengan nama itu.</p>
          )}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className={cn(MONO, 'text-[10px] text-muted-foreground')}>{picked.length} dipilih</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const pool = shown.filter((it) => !owned.has(it.name));
                const mix = [...pool].sort(() => Math.random() - 0.5).slice(0, 6);
                add(mix.map((it) => it.name));
              }}
            >
              Acak 6
            </Button>
            <Button size="sm" disabled={picked.length === 0} onClick={() => add(picked)}>
              <Plus />
              Tambah {picked.length || ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
