import * as React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@lib/utils';

export const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof PanelGroup>) => (
  <PanelGroup className={cn('flex h-full w-full', className)} {...props} />
);

export const ResizablePanel = Panel;

export const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & { withHandle?: boolean }) => (
  <PanelResizeHandle
    className={cn(
      'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-border bg-background">
        <span className="block h-2.5 w-px bg-muted-foreground/40" />
      </div>
    )}
  </PanelResizeHandle>
);
