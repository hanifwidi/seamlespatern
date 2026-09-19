import { Dices } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Switch } from '@components/ui/switch';
import { Label } from '@components/ui/label';
import { useHotkey } from '@generated/hooks/useHotkey';
import type { LayoutMode, RotMode } from '@generated/lib/pattern';
import type { Studio } from '@generated/hooks/useStudio';
import { MONO, NumberField, Panel, Row, Segmented, SliderRow } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';

export function ArrangePanel({ studio }: { studio: Studio }) {
  const { settings, patch } = studio;
  const shortfall = settings.mode === 'scatter' && studio.placedCount < Math.round(settings.count);

  useHotkey('r', () => studio.reseed());

  return (
    <Panel
      step="03"
      title="Susunan"
      note={`${studio.placedCount} ornamen / tile`}
      action={
        <Button size="xs" variant="outline" onClick={() => studio.reseed()}>
          <Dices />
          Acak ulang
        </Button>
      }
    >
      <Segmented<LayoutMode>
        label="Pola susunan"
        value={settings.mode}
        options={[
          { value: 'scatter', label: 'Acak' },
          { value: 'grid', label: 'Grid' },
          { value: 'brick', label: 'Brick' },
        ]}
        onChange={(v) => patch({ mode: v })}
      />

      <SliderRow
        label="Jumlah ornamen"
        value={settings.count}
        min={1}
        max={200}
        onChange={(v) => patch({ count: Math.round(v) })}
      />
      <SliderRow
        label="Ukuran ornamen"
        value={settings.sizeMm}
        min={4}
        max={250}
        suffix=" mm"
        onChange={(v) => patch({ sizeMm: v })}
      />
      {settings.mode === 'scatter' ? (
        <SliderRow
          label="Jarak minimum"
          value={settings.spacingMm}
          min={0}
          max={200}
          suffix=" mm"
          onChange={(v) => patch({ spacingMm: v })}
        />
      ) : (
        <SliderRow
          label="Geser acak (jitter)"
          value={settings.jitter}
          min={0}
          max={100}
          suffix=" %"
          onChange={(v) => patch({ jitter: Math.round(v) })}
        />
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Label htmlFor="randsize" className="text-[11px] font-normal text-muted-foreground">
          Ukuran acak per ornamen
        </Label>
        <Switch
          id="randsize"
          checked={settings.randomSize}
          onCheckedChange={(v) => patch({ randomSize: v })}
          aria-label="Ukuran acak per ornamen"
        />
      </div>
      <div className={cn(!settings.randomSize && 'pointer-events-none opacity-45')} aria-hidden={!settings.randomSize}>
        <Row label="Rentang %">
          <NumberField
            label="Skala minimum persen"
            value={settings.minPct}
            min={10}
            max={400}
            onCommit={(v) => patch({ minPct: v })}
          />
          <span className="text-[11px] text-muted-foreground">–</span>
          <NumberField
            label="Skala maksimum persen"
            value={settings.maxPct}
            min={10}
            max={400}
            suffix="%"
            onCommit={(v) => patch({ maxPct: v })}
          />
        </Row>
      </div>

      <Row label="Rotasi">
        <Segmented<RotMode>
          label="Rotasi ornamen"
          value={settings.rot}
          options={[
            { value: 'none', label: 'Tegak' },
            { value: 'quarter', label: '90°' },
            { value: 'free', label: 'Bebas' },
          ]}
          onChange={(v) => patch({ rot: v })}
        />
      </Row>

      <Row label="Seed">
        <NumberField
          label="Seed susunan"
          value={settings.seed}
          min={1}
          max={99999}
          onCommit={(v) => patch({ seed: Math.round(v) })}
        />
      </Row>

      {shortfall && (
        <p className={cn(MONO, 'text-[10px] leading-relaxed text-muted-foreground')}>
          Hanya {studio.placedCount} yang muat dengan jarak {Math.round(settings.spacingMm)} mm. Kecilkan jarak
          minimum untuk menambah jumlah.
        </p>
      )}
    </Panel>
  );
}
