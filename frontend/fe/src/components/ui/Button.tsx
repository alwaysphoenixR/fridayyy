import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './Input';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-12 px-6 text-label-lg";
    
    const variants = {
      primary: "bg-primary text-on-primary hover:bg-[#262626] focus:ring-primary",
      secondary: "bg-surface text-primary border border-outline hover:bg-[#F0F0F0] focus:ring-primary",
      accent: "bg-secondary text-on-secondary hover:brightness-110 focus:ring-secondary",
      ghost: "bg-transparent text-primary hover:bg-surface focus:ring-primary"
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
