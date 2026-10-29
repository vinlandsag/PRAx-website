"use client";
import { useId, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";

export function SidebarNavItem({
  selected,
  icon,
  children,
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { selected?: boolean; icon: ReactNode }) {
  return (
    <a
      {...props}
      aria-current={selected ? "page" : undefined}
      className={`flex min-h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-semibold text-sidebar-text max-sm:min-h-11 ${selected ? "border-l-2 border-lavender bg-sidebar-active text-white" : "hover:bg-sidebar-hover hover:text-white"} ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </a>
  );
}
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="inline-flex items-center gap-2">
            {i > 0 && <Icon name="chevron" size={12} />}
            {item.href && i < items.length - 1 ? (
              <a href={item.href} className="text-text-muted hover:text-primary">
                {item.label}
              </a>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="inline-flex max-w-full rounded-md bg-border-subtle p-1">
        {options.map((option) => (
          <label key={option.value} className="relative min-w-0">
            <input
              className="peer sr-only"
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span className="flex min-h-7 items-center justify-center rounded-sm px-4 text-[11px] font-semibold text-text-muted peer-checked:bg-surface peer-checked:text-primary peer-checked:shadow-xs peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-40 max-sm:min-h-11">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
