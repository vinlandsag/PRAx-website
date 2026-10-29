"use client";
import { useId, type ReactNode } from "react";

export interface FieldProps {
  label?: string;
  helperText?: string;
  error?: string;
  id?: string;
  required?: boolean;
}
export function useField({ id, helperText, error }: FieldProps, describedBy?: string) {
  const generated = useId();
  const fieldId = id || generated;
  return {
    fieldId,
    helpId: `${fieldId}-help`,
    errorId: `${fieldId}-error`,
    describedBy:
      [describedBy, helperText && `${fieldId}-help`, error && `${fieldId}-error`]
        .filter(Boolean)
        .join(" ") || undefined,
  };
}
export function Field({
  label,
  required,
  helperText,
  error,
  fieldId,
  children,
}: FieldProps & { fieldId: string; children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5 text-xs">
      {label && (
        <label htmlFor={fieldId} className="font-semibold text-text">
          {label}
          {required && (
            <span className="ml-1 text-danger-text" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {helperText && (
        <p id={`${fieldId}-help`} className="text-[11px] leading-relaxed text-text-muted">
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="text-[11px] text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
export const controlStyles =
  "w-full min-w-0 rounded-md border border-border bg-surface px-3 text-xs text-text min-h-(--control-md) placeholder:text-text-faint hover:border-text-faint focus-visible:border-primary disabled:bg-surface-subtle disabled:opacity-60 max-sm:min-h-11 max-sm:text-base";
