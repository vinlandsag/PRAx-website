import { Badge, type BadgeVariant } from "./Badge";
export const statuses = {
  open: ["Open", "lavender"],
  "awaiting-review": ["Awaiting review", "warning"],
  approved: ["Approved", "success"],
  rejected: ["Rejected", "danger"],
  draft: ["Draft", "warning"],
  active: ["Active", "success"],
  neutral: ["Neutral", "neutral"],
} as const;
export type Status = keyof typeof statuses;
export function StatusBadge({ status }: { status: Status }) {
  const [label, variant] = statuses[status];
  return (
    <Badge size="sm" variant={variant as BadgeVariant}>
      {label}
    </Badge>
  );
}
export function CategoryTag({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="lavender" size="sm">
      {children}
    </Badge>
  );
}
