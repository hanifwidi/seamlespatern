import { useEffect, useState, type ComponentProps } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { useMediaQuery } from '@generated/hooks/useMediaQuery';
import { useStudio } from '@generated/hooks/useStudio';
import { ControlRail } from '@generated/components/studio/ControlRail';
import { PatternPreview } from '@generated/components/studio/PatternPreview';
import { HelpSheet } from '@generated/components/studio/HelpSheet';
import { MONO, RegMark } from '@generated/components/studio/parts';
import { cn } from '@lib/utils';

const SPLIT_KEY = 'ornamen-press.split';

type SplitLayout = NonNullable<ComponentProps<typeof ResizablePanelGroup>['defaultLayout']>;

export default function App() {
  const studio = useStudio();
  const wide = useMediaQuery('(min-width: 1024px)');
  const [split, setSplit] = useState<SplitLayout | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SPLIT_KEY);
      if (raw) setSplit(JSON.parse(raw) as SplitLayout);
    } catch {
      setSplit(null);
    }
    setReady(true);
  }, []);

  function onLayoutChange(next: SplitLayout) {
    try {
      localStorage.setItem(SPLIT_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked — ratio just won't persist */
    }
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-[hsl(var(--surface-1))] px-3 sm:px-4">
        <RegMark className="shrink-0" />
        <h1 className="shrink-0 text-base font-light tracking-tight">Ornamen Press</h1>
        <span className={cn(MONO, 'hidden text-[10px] tracking-[0.14em] text-muted-foreground uppercase sm:inline')}>
          seamless pattern studio
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span
            className={cn(
              MONO,
              'rounded-full border border-border px-2 py-0.5 text-[10px] tracking-[0.1em] text-muted-foreground uppercase',
            )}
          >
            offline
          </span>
          <HelpSheet />
        </div>
      </header>

      {wide ? (
        ready ? (
          <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-0 flex-1"
            defaultLayout={split ?? undefined}
            onLayoutChange={onLayoutChange}
          >
            <ResizablePanel defaultSize={34} minSize={24} className="min-w-0">
              <ControlRail studio={studio} />
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Ubah lebar panel kontrol dan pratinjau" />
            <ResizablePanel defaultSize={66} minSize={30} className="min-w-0">
              <PatternPreview studio={studio} />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="min-h-0 flex-1" />
        )
      ) : (
        <Tabs defaultValue="preview" className="min-h-0 flex-1 gap-0">
          <TabsList className="mx-3 mt-2 shrink-0 self-start">
            <TabsTrigger value="preview">Pratinjau</TabsTrigger>
            <TabsTrigger value="controls">Atur pola</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-2 min-h-0 flex-1 overflow-hidden border-t border-border">
            <PatternPreview studio={studio} />
          </TabsContent>
          <TabsContent value="controls" className="mt-2 min-h-0 flex-1 overflow-hidden border-t border-border">
            <ControlRail studio={studio} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
