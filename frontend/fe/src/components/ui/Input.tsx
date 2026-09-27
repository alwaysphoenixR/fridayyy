import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-brand-black">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "flex w-full rounded-xl border border-brand-gray-200 bg-brand-gray-50 px-4 py-3 text-sm text-brand-black placeholder-brand-gray-500 focus:outline-none focus:border-brand-black focus:bg-white transition-all",
            error && "border-accent-red focus:border-accent-red",
            className
          )}
          {...props}
        />
        {error && <span className="text-label-sm text-error">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
