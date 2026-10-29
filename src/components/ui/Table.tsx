import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
  ReactNode,
} from "react";
import { StatusBadge, type Status } from "./StatusBadge";

export function TableContainer({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`overflow-hidden rounded-panel border border-border bg-surface shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
export function Table({
  children,
  className = "",
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label={props["aria-label"] || "Table"}
      tabIndex={0}
    >
      <table
        {...props}
        className={`w-full border-collapse text-left text-[11px] max-sm:text-xs ${className}`}
      >
        {children}
      </table>
    </div>
  );
}
export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-surface-subtle text-[9px] max-sm:text-[11px] tracking-wider text-text-muted uppercase">
      {children}
    </thead>
  );
}
export function TableRow({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={`border-b border-border-subtle last:border-0 hover:bg-surface-subtle/60 ${className}`}
    />
  );
}
export function TableHead({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" {...props} className={`px-4 py-3 font-semibold ${className}`} />;
}
export function TableCell({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={`px-4 py-3 align-middle ${className}`} />;
}
export function StatusCell({ status }: { status: Status }) {
  return (
    <TableCell>
      <StatusBadge status={status} />
    </TableCell>
  );
}
export function ActionCell({ children }: { children: ReactNode }) {
  return (
    <TableCell>
      <div className="flex items-center gap-2 whitespace-nowrap">{children}</div>
    </TableCell>
  );
}
export function TableEmptyState({
  colSpan,
  children = "No submissions yet",
}: {
  colSpan: number;
  children?: ReactNode;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-text-muted">
        {children}
      </TableCell>
    </TableRow>
  );
}
