"use client";
import React, { useId } from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  content?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline" | "segmented";
  className?: string;
  label?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "pills",
  className = "",
  label = "Sections",
}) => {
  const id = useId();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    if (tabs[nextIndex].disabled) {
      const direction = e.key === "ArrowLeft" || e.key === "End" ? -1 : 1;
      let attempts = 0;
      while (tabs[nextIndex].disabled && attempts++ < tabs.length)
        nextIndex = (nextIndex + direction + tabs.length) % tabs.length;
      if (tabs[nextIndex].disabled) return;
    }
    e.preventDefault();
    onChange(tabs[nextIndex].id);
    const target = e.currentTarget.parentElement?.children[nextIndex] as HTMLButtonElement;
    target?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className={`flex items-center gap-1.5 overflow-x-auto py-1 ${variant === "segmented" ? "inline-flex rounded-md bg-border-subtle p-1" : ""} ${variant === "underline" ? "border-b border-border" : ""} ${className}`}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              id={`${id}-${tab.id}`}
              aria-controls={tab.content !== undefined ? `${id}-${tab.id}-panel` : undefined}
              disabled={tab.disabled}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={() => onChange(tab.id)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors disabled:opacity-40 max-sm:min-h-11 whitespace-nowrap select-none flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary ${
                variant === "segmented"
                  ? isActive
                    ? "bg-surface text-primary shadow-xs"
                    : "text-text-muted hover:text-text"
                  : variant === "underline"
                    ? isActive
                      ? "border-b-2 border-primary text-primary"
                      : "border-b-2 border-transparent text-text-muted hover:text-text"
                    : isActive
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface text-text-muted border border-border hover:bg-surface-hover hover:text-text"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                    isActive ? "bg-white/20 text-white" : "bg-border-subtle text-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {tabs.map(
        (tab) =>
          tab.content !== undefined && (
            <div
              key={tab.id}
              role="tabpanel"
              id={`${id}-${tab.id}-panel`}
              aria-labelledby={`${id}-${tab.id}`}
              hidden={activeTab !== tab.id}
              tabIndex={0}
              className="py-3 text-xs text-text-muted"
            >
              {tab.content}
            </div>
          )
      )}
    </div>
  );
};
