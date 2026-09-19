import type { Studio } from '@generated/hooks/useStudio';
import { OrnamentPanel } from '@generated/components/studio/OrnamentPanel';
import { CanvasPanel } from '@generated/components/studio/CanvasPanel';
import { ArrangePanel } from '@generated/components/studio/ArrangePanel';
import { ColorPanel } from '@generated/components/studio/ColorPanel';
import { VariationPanel } from '@generated/components/studio/VariationPanel';
import { ExportPanel } from '@generated/components/studio/ExportPanel';

export function ControlRail({ studio }: { studio: Studio }) {
  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[hsl(var(--surface-1))]">
      <OrnamentPanel studio={studio} />
      <CanvasPanel studio={studio} />
      <ArrangePanel studio={studio} />
      <ColorPanel studio={studio} />
      <VariationPanel studio={studio} />
      <ExportPanel studio={studio} />
      <p className="px-3 py-4 text-[10px] leading-relaxed text-muted-foreground">
        Semua proses jalan di perangkat ini: baca SVG, susun pola, tulis EPS dan JPG. Tidak ada data yang dikirim ke
        mana pun.
      </p>
    </div>
  );
}
