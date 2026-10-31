"use client";
import React, { useEffect, useEffectEvent, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface ModalProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}
export function Modal({
  id,
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const close = useEffectEvent(onClose);
  useEffect(() => {
    if (!isOpen || !dialog.current) return;
    const active = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const root = dialog.current.parentElement!;
    const siblings = [...document.body.children].filter((el) => el !== root) as HTMLElement[];
    const previousInert = siblings.map((el) => el.inert);
    siblings.forEach((el) => {
      el.inert = true;
    });
    document.body.style.overflow = "hidden";
    const focusable = () =>
      [
        ...(dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
        ) || []),
      ].filter((el) => !el.hidden && !el.closest("[hidden], [inert]"));
    (focusable()[0] || dialog.current).focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first) {
        event.preventDefault();
        dialog.current?.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const focusin = (event: FocusEvent) => {
      if (!dialog.current?.contains(event.target as Node))
        (focusable()[0] || dialog.current)?.focus();
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", focusin);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", focusin);
      document.body.style.overflow = overflow;
      siblings.forEach((el, i) => {
        el.inert = previousInert[i];
      });
      if (active?.isConnected) active.focus();
    };
  }, [isOpen]);
  if (!isOpen || typeof document === "undefined") return null;
  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" };
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--dialog-overlay) p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        id={id}
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Dialog"}
        aria-describedby={subtitle ? descriptionId : undefined}
        tabIndex={-1}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-panel border border-border bg-surface shadow-modal ${widths[maxWidth]}`}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div>
            {badge && (
              <p className="mb-2 text-[10px] font-bold tracking-widest text-primary uppercase">
                {badge}
              </p>
            )}
            {title && (
              <h2 id={titleId} className="text-lg font-bold tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p id={descriptionId} className="mt-2 text-xs leading-relaxed text-text-muted">
                {subtitle}
              </p>
            )}
          </div>
          <Button variant="text" iconOnly aria-label="Close dialog" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 py-3 text-xs leading-relaxed">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
export { Modal as Dialog };
