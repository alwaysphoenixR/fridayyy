import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from './Input';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-surface-card rounded-2xl border border-subtle p-6 shadow-card transition-all",
          hoverable && "hover:shadow-elevated cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
