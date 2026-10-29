/* eslint-disable @next/next/no-img-element -- Small local reference crops retain their exact pixels. */
import type { ReactNode } from "react";
import { Card } from "./Card";
import { CategoryTag, StatusBadge, type Status } from "./StatusBadge";
export interface TaskCardProps {
  title: string;
  description: string;
  category: string;
  points: number;
  status?: Status;
  artwork?: string;
  artworkAlt?: string;
  deadline?: string;
  action?: ReactNode;
}
export function TaskCard({
  title,
  description,
  category,
  points,
  status = "open",
  artwork,
  artworkAlt = "",
  deadline,
  action,
}: TaskCardProps) {
  return (
    <Card className="flex min-h-(--layout-task-card-height) min-w-0 flex-col p-3.5">
      <div className="flex items-start gap-3">
        {artwork && (
          <img
            src={artwork}
            alt={artworkAlt}
            width={80}
            height={75}
            className="h-(--layout-task-height) w-(--layout-task-width) shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0">
          <StatusBadge status={status} />
          <h3 className="mt-2 text-xs leading-snug font-bold">{title}</h3>
          <p className="mt-1.5 text-[10px] max-sm:text-xs leading-relaxed text-text-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2.5 text-[10px]">
        <CategoryTag>{category}</CategoryTag>
        <span className="font-semibold text-primary">{points} pts max</span>
        {deadline && <span className="ml-auto text-text-muted">{deadline}</span>}
        {action}
      </div>
    </Card>
  );
}
