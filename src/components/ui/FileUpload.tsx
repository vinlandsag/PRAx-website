"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface FileUploadProps {
  label?: string;
  disabled?: boolean;
  maxBytes?: number;
  error?: string;
  onFileChange?: (file: File | null) => void;
}
export function validateScreenshot(files: File[], maxBytes = 5 * 1024 * 1024): string | undefined {
  if (files.length !== 1) return "Choose one screenshot at a time.";
  if (!["image/png", "image/jpeg"].includes(files[0].type)) return "Use a PNG or JPEG image.";
  if (!files[0].size) return "This file is empty. Choose another image.";
  if (files[0].size > maxBytes)
    return `Image must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`;
}
export function FileUpload({
  label = "Screenshot (optional)",
  disabled,
  maxBytes = 5 * 1024 * 1024,
  error,
  onFileChange,
}: FileUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<{ file: File; url: string }>();
  const [validation, setValidation] = useState<string>();
  const [dragging, setDragging] = useState(false);
  useEffect(
    () => () => {
      if (selection) URL.revokeObjectURL(selection.url);
    },
    [selection]
  );
  const choose = (files: File[]) => {
    if (disabled || !files.length) return;
    const invalid = validateScreenshot(files, maxBytes);
    setValidation(invalid);
    if (invalid) return;
    setSelection({ file: files[0], url: URL.createObjectURL(files[0]) });
    onFileChange?.(files[0]);
  };
  const remove = () => {
    setSelection(undefined);
    setValidation(undefined);
    onFileChange?.(null);
    input.current?.focus();
  };
  const message = validation || error;
  return (
    <div className={`flex flex-col gap-2 text-xs ${disabled ? "opacity-50" : ""}`}>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          choose(Array.from(event.dataTransfer.files));
        }}
        className={`relative rounded-lg border border-dashed bg-surface-subtle p-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${dragging ? "border-primary bg-lavender" : message ? "border-danger-text" : "border-lavender-border"}`}
      >
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/png,image/jpeg"
          disabled={disabled}
          aria-invalid={!!message}
          aria-describedby={`${id}-help${message ? ` ${id}-error` : ""}`}
          className="peer sr-only"
          onChange={(event) => {
            choose(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
        <label
          htmlFor={id}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 text-primary ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <Icon name="plus" />
          <span className="text-[11px] font-semibold">
            {selection ? "Choose a different screenshot" : "Click to upload a screenshot"}
          </span>
          <span id={`${id}-help`} className="text-[10px] text-text-muted">
            PNG or JPG · up to {Math.round(maxBytes / 1024 / 1024)} MB · or drag and drop
          </span>
        </label>
        {selection && (
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selection.url}
              alt={`Preview of ${selection.file.name}`}
              className="h-16 w-20 rounded-md object-contain"
              onError={() => {
                setValidation("This image could not be read. Choose another PNG or JPEG.");
                setSelection(undefined);
                onFileChange?.(null);
              }}
            />
            <p className="min-w-0 flex-1 truncate text-[11px]">{selection.file.name}</p>
            <Button
              variant="text"
              iconOnly
              disabled={disabled}
              aria-label="Remove screenshot"
              onClick={remove}
            >
              <Icon name="trash" />
            </Button>
          </div>
        )}
      </div>
      {message && (
        <p id={`${id}-error`} role="alert" className="text-[11px] text-danger-text">
          {message}
        </p>
      )}
    </div>
  );
}
