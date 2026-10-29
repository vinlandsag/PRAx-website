"use client";
import type { ReactNode, HTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";
import { Button } from "./Button";

type Tone = "info" | "success" | "warning" | "danger";
const toneStyles: Record<Tone, string> = {
  info: "bg-lavender text-lavender-text border-lavender-border",
  success: "bg-success-bg text-success-text border-success-border",
  warning: "bg-warning-bg text-warning-text border-warning-border",
  danger: "bg-danger-bg text-danger-text border-danger-border",
};
export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-[11px] leading-relaxed ${toneStyles[tone]}`}
    >
      <Icon name={tone === "success" ? "check" : "info"} />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-danger-text">
      <Icon name="info" size={14} />
      {children}
    </p>
  );
}
export function Toast({
  message,
  tone = "success",
  onDismiss,
}: {
  message: string;
  tone?: Tone;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-modal">
      <div
        role={tone === "danger" ? "alert" : "status"}
        className={`flex items-center gap-2 text-xs ${tone === "danger" ? "text-danger-text" : "text-text"}`}
      >
        <Icon name={tone === "success" ? "check" : "info"} />
        {message}
      </div>
      <Button
        iconOnly
        size="sm"
        variant="text"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <Icon name="close" size={14} />
      </Button>
    </div>
  );
}
export function Skeleton({
  className = "",
  label = "Loading",
  ...props
}: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div
      {...props}
      role="status"
      aria-label={label}
      className={`animate-pulse rounded-md bg-border-subtle ${className}`}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
  icon = "file",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center">
      <span className="rounded-lg bg-lavender p-2 text-primary">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="text-sm font-bold">{title}</h3>
      {description && (
        <p className="max-w-xs text-xs leading-relaxed text-text-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
