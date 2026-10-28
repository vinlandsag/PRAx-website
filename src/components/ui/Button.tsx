import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "lavender";
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
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";

    const variantStyles = {
      primary: "bg-primary text-white hover:bg-primary-hover shadow-xs active:scale-[0.99]",
      secondary:
        "bg-surface text-text border border-border hover:bg-surface-hover hover:border-border-subtle shadow-xs active:scale-[0.99]",
      ghost: "bg-transparent text-text-secondary hover:bg-border-subtle hover:text-text",
      danger:
        "bg-danger-bg text-danger-text border border-danger-border hover:brightness-95 active:scale-[0.99]",
      outline:
        "bg-surface text-primary border border-primary/30 hover:bg-lavender hover:border-primary active:scale-[0.99]",
      lavender: "bg-lavender text-lavender-text hover:bg-lavender-border active:scale-[0.99]",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5 min-h-[32px]",
      md: "text-sm px-4 py-2 rounded-xl gap-2 min-h-[40px]",
      lg: "text-base px-5 py-2.5 rounded-xl gap-2.5 min-h-[46px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
