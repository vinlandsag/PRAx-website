import React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  colorScheme?: "purple" | "orange" | "blue" | "teal" | "green" | "gray";
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = "md",
  isOnline,
  colorScheme = "purple",
  className = "",
  ...props
}) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizeStyles = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-2xl font-bold",
  };

  const colorStyles = {
    purple: "bg-primary text-white",
    orange: "bg-streak text-white",
    blue: "bg-[#3B82F6] text-white",
    teal: "bg-[#0D9488] text-white",
    green: "bg-[#16A34A] text-white",
    gray: "bg-border-subtle text-text-secondary border border-border",
  };

  const onlineDotSizes = {
    xs: "h-1.5 w-1.5 bottom-0 right-0",
    sm: "h-2 w-2 bottom-0 right-0",
    md: "h-2.5 w-2.5 bottom-0.5 right-0.5",
    lg: "h-3.5 w-3.5 bottom-0.5 right-0.5",
    xl: "h-4.5 w-4.5 bottom-1 right-1",
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} {...props}>
      <div
        className={`rounded-full flex items-center justify-center font-semibold select-none overflow-hidden ${sizeStyles[size]} ${colorStyles[colorScheme]}`}
        title={name}
        role="img"
        aria-label={name}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute rounded-full ring-2 ring-surface ${
            isOnline ? "bg-emerald-500" : "bg-text-faint"
          } ${onlineDotSizes[size]}`}
          title={isOnline ? "Online" : "Offline"}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
