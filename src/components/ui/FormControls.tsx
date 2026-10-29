"use client";
import {
  forwardRef,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import { Field, useField, controlStyles, type FieldProps } from "./Field";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(function Textarea(
  {
    label,
    helperText,
    error,
    id,
    required,
    className = "",
    "aria-describedby": description,
    ...props
  },
  ref
) {
  const field = useField({ id, helperText, error }, description);
  return (
    <Field {...{ label, helperText, error, required }} fieldId={field.fieldId}>
      <textarea
        {...props}
        ref={ref}
        id={field.fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={field.describedBy}
        className={`${controlStyles} min-h-24 resize-y py-2 ${error ? "border-danger-text" : ""} ${className}`}
      />
    </Field>
  );
});
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(function Select(
  {
    label,
    helperText,
    error,
    id,
    required,
    className = "",
    children,
    "aria-describedby": description,
    ...props
  },
  ref
) {
  const field = useField({ id, helperText, error }, description);
  return (
    <Field {...{ label, helperText, error, required }} fieldId={field.fieldId}>
      <select
        {...props}
        ref={ref}
        id={field.fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={field.describedBy}
        className={`${controlStyles} pr-7 ${error ? "border-danger-text" : ""} ${className}`}
      >
        {children}
      </select>
    </Field>
  );
});

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & FieldProps;
export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(function Checkbox(
  {
    label,
    helperText,
    error,
    id,
    required,
    className = "",
    "aria-describedby": description,
    ...props
  },
  ref
) {
  const field = useField({ id, helperText, error }, description);
  return (
    <Field {...{ helperText, error }} fieldId={field.fieldId}>
      <label
        className={`inline-flex min-h-6 items-center gap-2 text-xs text-text max-sm:min-h-11 ${props.disabled ? "opacity-50" : "cursor-pointer"} ${className}`}
      >
        <input
          {...props}
          ref={ref}
          id={field.fieldId}
          type="checkbox"
          required={required}
          aria-invalid={!!error}
          aria-describedby={field.describedBy}
          className="size-4 shrink-0 accent-primary"
        />
        <span>
          {label}
          {required && (
            <span className="ml-1 text-danger-text" aria-hidden="true">
              *
            </span>
          )}
        </span>
      </label>
    </Field>
  );
});
export const Toggle = forwardRef<HTMLInputElement, ChoiceProps>(function Toggle(
  {
    label,
    helperText,
    error,
    id,
    required,
    className = "",
    "aria-describedby": description,
    ...props
  },
  ref
) {
  const field = useField({ id, helperText, error }, description);
  return (
    <Field {...{ helperText, error }} fieldId={field.fieldId}>
      <label
        className={`inline-flex min-h-8 items-center justify-between gap-4 text-xs font-medium text-text max-sm:min-h-11 ${props.disabled ? "opacity-50" : "cursor-pointer"} ${className}`}
      >
        <span>
          {label}
          {required && (
            <span aria-hidden="true" className="text-danger-text">
              {" "}
              *
            </span>
          )}
        </span>
        <span className="relative inline-flex">
          <input
            {...props}
            ref={ref}
            id={field.fieldId}
            type="checkbox"
            role="switch"
            required={required}
            aria-invalid={!!error}
            aria-describedby={field.describedBy}
            className="peer absolute inset-0 size-full opacity-0"
          />
          <span className="pointer-events-none h-4 w-7 rounded-full bg-text-faint peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-primary" />
          <span className="pointer-events-none absolute top-0.5 left-0.5 size-3 rounded-full bg-white transition-transform peer-checked:translate-x-3" />
        </span>
      </label>
    </Field>
  );
});
