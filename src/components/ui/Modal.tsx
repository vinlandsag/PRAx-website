"use client";

import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`w-full ${maxWidthStyles[maxWidth]} bg-surface rounded-2xl shadow-modal border border-border overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {(badge || title) && (
          <div className="p-6 pb-2 text-center flex flex-col items-center">
            {badge && (
              <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase mb-1.5">
                {badge}
              </span>
            )}
            {title && (
              <h2 id="modal-title" className="text-xl font-bold text-text tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-sm">{subtitle}</p>
            )}
          </div>
        )}
        <div className="p-6 pt-3 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="p-6 pt-0 border-t border-border-subtle mt-2 flex items-center justify-between">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
