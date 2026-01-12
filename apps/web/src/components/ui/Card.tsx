import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, noPadding = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-background-card dark:bg-background-card border border-border-primary dark:border-border-primary shadow-sm transition-all duration-200',
          !noPadding && 'p-6',
          className
        )}
        {...props}
      />
    );
  }
); 