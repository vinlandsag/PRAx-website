export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
}: {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
}) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const bounded = Math.min(safeMax, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-[11px] font-medium">
        <span>{label}</span>
        {showValue && (
          <span className="font-semibold text-primary">
            {Math.round((bounded / safeMax) * 100)}%
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={bounded}
        className="h-1.5 overflow-hidden rounded-full bg-border-subtle"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${(bounded / safeMax) * 100}%` }}
        />
      </div>
    </div>
  );
}
