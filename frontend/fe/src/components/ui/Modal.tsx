import React, { HTMLAttributes, forwardRef, useEffect } from 'react';
import { cn } from './Input';
import { X } from 'lucide-react';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, title, children, ...props }, ref) => {
    
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
        <div
          ref={ref}
          className={cn(
            "relative w-full max-w-2xl bg-surface-card rounded-[24px] shadow-modal border border-subtle p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200",
            className
          )}
          {...props}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-brand-black leading-snug">{title}</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-subtle transition-colors text-brand-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  }
);
Modal.displayName = 'Modal';
