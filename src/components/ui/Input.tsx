"use client";
import React from "react";
import { Field, useField, controlStyles } from "./Field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      className = "",
      id,
      required,
      "aria-describedby": externalDescription,
      ...props
    },
    ref
  ) => {
    const { fieldId: inputId, describedBy } = useField(
      { id, helperText, error },
      externalDescription
    );

    return (
      <Field
        fieldId={inputId}
        label={label}
        helperText={helperText}
        error={error}
        required={required}
      >
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span
              className="absolute left-3.5 text-text-muted pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            className={`${controlStyles} ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${
              error
                ? "border-danger-border ring-1 ring-danger-text/20"
                : "border-border hover:border-text-muted/40"
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <span
              className="absolute right-3.5 text-text-muted flex items-center justify-center"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>
      </Field>
    );
  }
);
Input.displayName = "Input";
