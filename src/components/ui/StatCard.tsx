import React from "react";
import { Card } from "./Card";
import { Icon } from "./Icon";

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
    <Card className={`relative p-3.5 flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] leading-3 font-medium text-text-muted max-sm:text-xs">
          {label}
        </span>
        {icon && (
          <div
            className={`absolute right-3.5 top-3.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-1.5">
        <div className="text-[22px] leading-6 font-bold tracking-tight text-text">{value}</div>
        {subtext && (
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] leading-3 text-text-muted max-sm:text-xs">
            {subtextTrend === "up" && (
              <span className="text-success-text -rotate-45" aria-hidden="true">
                <Icon name="arrow" size={11} />
              </span>
            )}
            {subtextTrend === "down" && (
              <span className="text-danger-text rotate-45" aria-hidden="true">
                <Icon name="arrow" size={11} />
              </span>
            )}
            <span>{subtext}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
