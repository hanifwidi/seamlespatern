import { useState, type ReactNode } from 'react';
import { Slider } from '@components/ui/slider';
import { Input } from '@components/ui/input';
import { MONO } from '@generated/components/studio/tokens';
import { cn } from '@lib/utils';

export { MONO };
export { Panel } from '@generated/components/studio/Panel';

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[86px] shrink-0 text-[11px] leading-tight text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

export function NumberField({
  value,
  onCommit,
  min,
  max,
  step = 1,
  suffix,
  label,
}: {
  value: number;
  onCommit: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  label: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null) {
      const v = Number(draft);
      if (Number.isFinite(v) && draft.trim() !== '') onCommit(Math.max(min, Math.min(max, v)));
    }
    setDraft(null);
  };
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Input
        aria-label={label}
        type="number"
        value={draft ?? String(value)}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
        className={cn(MONO, 'h-8 w-full min-w-0 px-2 text-right text-[16px] tabular-nums sm:text-xs')}
      />
      {suffix ? <span className={cn(MONO, 'shrink-0 text-[10px] text-muted-foreground')}>{suffix}</span> : null}
    </div>
  );
}

export function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn('space-y-2', disabled && 'opacity-45')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={cn(MONO, 'text-[11px] tabular-nums')}>
          {Math.round(value * 10) / 10}
          {suffix}
        </span>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <fieldset
      aria-label={label}
      className="flex min-w-0 overflow-hidden rounded-md border border-border [min-inline-size:0]"
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'min-w-0 flex-1 truncate px-2 py-[7px] text-[11px] transition-colors outline-none focus-visible:ring-[2px] focus-visible:ring-ring',
              i > 0 && 'border-l border-border',
              active
                ? 'bg-[hsl(var(--surface-3))] font-medium text-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-[hsl(var(--surface-2))]',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </fieldset>
  );
}

/** Press registration mark — the studio's identity glyph. */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-4 text-primary', className)}>
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 0v8M12 16v8M0 12h8M16 12h8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
