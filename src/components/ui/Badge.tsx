import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "lavender" | "neutral" | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  icon,
  className = "",
  ...props
}) => {
  const variantStyles = {
    success: "bg-success-bg text-success-text border border-success-border",
    warning: "bg-warning-bg text-warning-text border border-warning-border",
    danger: "bg-danger-bg text-danger-text border border-danger-border",
    lavender: "bg-lavender text-lavender-text border border-lavender-border",
    neutral: "bg-border-subtle text-text-secondary border border-border",
    info: "bg-info-bg text-info-text border border-info-border",
  };

  const dotStyles = {
    success: "bg-success-dot",
    warning: "bg-warning-dot",
    danger: "bg-danger-dot",
    lavender: "bg-primary",
    neutral: "bg-text-muted",
    info: "bg-info-dot",
  };

  const sizeStyles = {
    sm: "text-[10px] max-sm:text-[11px] leading-4 font-semibold px-1.5 rounded-sm gap-1",
    md: "text-[11px] leading-5 font-semibold px-2 rounded-sm gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-sans tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
