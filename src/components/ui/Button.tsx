import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    "primary" | "secondary" | "ghost" | "danger" | "outline" | "lavender" | "text" | "destructive";
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      iconOnly = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 select-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 max-sm:min-h-11 max-sm:min-w-11";

    const variantStyles = {
      primary:
        "bg-primary text-white enabled:hover:bg-primary-hover shadow-xs enabled:active:bg-primary-pressed",
      secondary:
        "bg-surface text-text border border-border enabled:hover:bg-surface-hover enabled:active:bg-border-subtle shadow-xs",
      ghost:
        "bg-transparent text-text-secondary enabled:hover:bg-border-subtle enabled:hover:text-text enabled:active:bg-border",
      danger:
        "bg-danger-bg text-danger-text border border-danger-border enabled:hover:brightness-95 enabled:active:brightness-90",
      outline:
        "bg-surface text-primary border border-primary/30 enabled:hover:bg-lavender enabled:hover:border-primary enabled:active:bg-lavender-border",
      lavender:
        "bg-lavender text-lavender-text enabled:hover:bg-lavender-border enabled:active:brightness-95",
      text: "text-primary enabled:hover:bg-lavender enabled:active:bg-lavender-border",
      destructive:
        "bg-danger-bg text-danger-text border border-danger-border enabled:hover:brightness-95 enabled:active:brightness-90",
    };

    const sizeStyles = {
      sm: "text-[11px] px-2.5 rounded-md gap-1.5 min-h-(--control-sm)",
      md: "text-xs px-3 rounded-md gap-1.5 min-h-(--control-md)",
      lg: "text-sm px-4 rounded-lg gap-2 min-h-(--control-lg)",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${iconOnly ? "aspect-square px-2" : ""} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        ) : (
          leftIcon
        )}
        <span className="inline-flex items-center gap-1.5">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
