import * as React from 'react';
import { cn } from '@lib/utils';

export const Empty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col items-center gap-4 text-center', className)} {...props} />
  ),
);
Empty.displayName = 'Empty';

export const EmptyHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col items-center gap-2', className)} {...props} />
);

export const EmptyMedia = ({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'icon' | 'image' }) => (
  <div
    className={cn('flex items-center justify-center text-muted-foreground', variant === 'icon' && '[&>svg]:size-6', className)}
    {...props}
  />
);

export const EmptyTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-medium', className)} {...props} />
);

export const EmptyDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-muted-foreground', className)} {...props} />
);

export const EmptyContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('w-full', className)} {...props} />
);
