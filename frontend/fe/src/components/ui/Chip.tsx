import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from './Input';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'active' | 'critical';
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center px-3 h-7 rounded-full text-label-md font-semibold whitespace-nowrap";
    
    const variants = {
      neutral: "bg-[#F0F0F0] text-primary",
      active: "bg-secondary/10 text-secondary",
      critical: "bg-tertiary/10 text-tertiary"
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Chip.displayName = 'Chip';
