import React from "react";
import { Card } from "./Card";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  subtextTrend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  subtextTrend,
  icon,
  iconBg = "bg-lavender text-primary",
  className = "",
}) => {
  return (
    <Card className={`p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {icon && (
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-text">{value}</div>
        {subtext && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-text-muted">
            {subtextTrend === "up" && (
              <span className="text-success-text font-semibold" aria-hidden="true">
                ↗
              </span>
            )}
            {subtextTrend === "down" && (
              <span className="text-danger-text font-semibold" aria-hidden="true">
                ↘
              </span>
            )}
            <span>{subtext}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
