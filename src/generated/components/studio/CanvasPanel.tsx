import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import type { Studio } from '@generated/hooks/useStudio';
import { CANVAS_PRESETS, pixelSize } from '@generated/lib/presets';
import { MONO, NumberField, Panel, Row, Segmented } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';

export function CanvasPanel({ studio }: { studio: Studio }) {
  const { settings, patch } = studio;
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const px4 = pixelSize(settings.wMm, settings.hMm, 4096);
  const px8 = pixelSize(settings.wMm, settings.hMm, 8192);

  return (
    <Panel
      step="02"
      title="Kanvas"
      note={`${Math.round(settings.wMm)} × ${Math.round(settings.hMm)} mm`}
      action={
        <Button size="icon-xs" variant="ghost" aria-label="Putar orientasi" onClick={() => studio.flipOrientation()}>
          <RotateCw />
        </Button>
      }
    >
      <Segmented
        label="Ukuran kanvas"
        value={CANVAS_PRESETS.some((c) => c.id === settings.canvas) ? settings.canvas : 'custom'}
        options={[...CANVAS_PRESETS.map((c) => ({ value: c.id, label: c.label })), { value: 'custom', label: 'Bebas' }]}
        onChange={(v) => (v === 'custom' ? patch({ canvas: 'custom' }) : studio.setCanvas(v))}
      />

      <Row label="Lebar / tinggi">
        <NumberField
          label="Lebar kanvas (mm)"
          value={Math.round(settings.wMm)}
          min={20}
          max={2000}
          onCommit={(v) => patch({ wMm: v, canvas: 'custom' })}
        />
        <span className="text-[11px] text-muted-foreground">×</span>
        <NumberField
          label="Tinggi kanvas (mm)"
          value={Math.round(settings.hMm)}
          min={20}
          max={2000}
          suffix="mm"
          onCommit={(v) => patch({ hMm: v, canvas: 'custom' })}
        />
      </Row>

      <Row label="Warna latar">
        <input
          type="color"
          aria-label="Warna latar kanvas"
          value={settings.bg}
          onChange={(e) => patch({ bg: e.target.value })}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-sm border border-border bg-[hsl(var(--surface-2))] p-1"
        />
        <Input
          aria-label="Kode warna latar"
          value={hexDraft ?? settings.bg}
          onBlur={() => setHexDraft(null)}
          onChange={(e) => {
            const v = e.target.value.trim();
            setHexDraft(v);
            if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ bg: v.toLowerCase() });
          }}
          className={cn(MONO, 'h-8 min-w-0 flex-1 px-2 text-[16px] uppercase sm:text-xs')}
        />
      </Row>

      <dl className={cn(MONO, 'grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border pt-2 text-[10px]')}>
        <dt className="text-muted-foreground">JPG 4K</dt>
        <dd className="text-right tabular-nums">
          {px4.w} × {px4.h} px
        </dd>
        <dt className="text-muted-foreground">JPG 8K</dt>
        <dd className="text-right tabular-nums">
          {px8.w} × {px8.h} px
        </dd>
        <dt className="text-muted-foreground">Artboard EPS</dt>
        <dd className="text-right tabular-nums">4096 px</dd>
      </dl>
    </Panel>
  );
}
