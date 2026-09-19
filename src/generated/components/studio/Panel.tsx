import { useEffect, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { loadJson, saveJson } from '@generated/lib/presets';
import { MONO } from '@generated/components/studio/tokens';
import { cn } from '@lib/utils';

const KEY = 'ornamen-press.panels';

type OpenMap = Record<string, boolean>;

function usePanelOpen(id: string): [boolean, () => void] {
  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const map = loadJson<OpenMap>(KEY, {});
    if (map[id] === false) setOpen(false);
    setHydrated(true);
  }, [id]);

  useEffect(() => {
    if (!hydrated) return;
    saveJson(KEY, { ...loadJson<OpenMap>(KEY, {}), [id]: open });
  }, [hydrated, id, open]);

  return [open, () => setOpen((v) => !v)];
}

/** Collapsible control section. The step number doubles as its persistence key. */
export function Panel({
  step,
  title,
  note,
  action,
  children,
}: {
  step: string;
  title: string;
  note?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, toggle] = usePanelOpen(step);
  const body = `panel-${step}`;

  return (
    <section className="border-b border-border">
      <header className="flex h-9 items-center gap-2 border-b border-border bg-[hsl(var(--surface-2))] pr-2 pl-1">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={body}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-none focus-visible:ring-[2px] focus-visible:ring-ring"
        >
          <ChevronRight
            className={cn('size-3 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
            aria-hidden="true"
          />
          <span className={cn(MONO, 'shrink-0 text-[10px] text-muted-foreground')}>{step}</span>
          <h2 className="shrink-0 text-[11px] font-semibold tracking-[0.08em] uppercase">{title}</h2>
          {note ? (
            <span className={cn(MONO, 'min-w-0 truncate text-[10px] text-muted-foreground')}>{note}</span>
          ) : null}
        </button>
        {action ? <div className="flex shrink-0 items-center gap-1">{action}</div> : null}
      </header>
      {open ? (
        <div id={body} className="space-y-3 px-3 py-3">
          {children}
        </div>
      ) : null}
    </section>
  );
}
