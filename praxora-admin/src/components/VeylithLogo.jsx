import React from 'react';

/**
 * Veylith Logo Component
 * Geometric, futuristic symbol featuring an interconnected precision 'V' mark
 * and crisp typography.
 */
export default function VeylithLogo({
  variant = 'full', // 'full' | 'mark' | 'wordmark'
  size = 'md',     // 'sm' | 'md' | 'lg' | 'xl'
  showTagline = false,
  subBadge = 'CONTROL',
  className = '',
}) {
  const sizeMap = {
    sm: { mark: 24, text: 'text-base', badge: 'text-[9px]', gap: 'gap-2' },
    md: { mark: 32, text: 'text-xl', badge: 'text-[10px]', gap: 'gap-3' },
    lg: { mark: 44, text: 'text-2xl', badge: 'text-[11px]', gap: 'gap-3.5' },
    xl: { mark: 64, text: 'text-4xl', badge: 'text-xs', gap: 'gap-4' },
  };

  const config = sizeMap[size] || sizeMap.md;

  const markSvg = (
    <svg
      width={config.mark}
      height={config.mark}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
      aria-label="Veylith Mark"
      role="img"
    >
      <defs>
        <linearGradient id="veylithGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B7CFF" />
          <stop offset="100%" stopColor="#55D6BE" />
        </linearGradient>
        <linearGradient id="veylithGradGlow" x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B7CFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#55D6BE" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Subtle outer geometric container with precision cutouts */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="#0D1017"
        stroke="#252C3A"
        strokeWidth="1.5"
      />

      {/* Ambient depth background */}
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="12"
        fill="url(#veylithGradGlow)"
      />

      {/* Outer Precision Wing - Left */}
      <path
        d="M16 18L32 48L24 48L12 24L16 18Z"
        fill="url(#veylithGradPrimary)"
      />

      {/* Outer Precision Wing - Right */}
      <path
        d="M48 18L32 48L40 48L52 24L48 18Z"
        fill="url(#veylithGradPrimary)"
      />

      {/* Synchronized Central Vertex Diamond */}
      <path
        d="M32 20L38 29L32 38L26 29L32 20Z"
        fill="#F3F5FA"
        stroke="#8B7CFF"
        strokeWidth="1.5"
      />

      {/* Base Anchor Point */}
      <circle cx="32" cy="48" r="2.5" fill="#55D6BE" />
    </svg>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{markSvg}</div>;
  }

  return (
    <div className={`inline-flex items-center ${config.gap} ${className}`}>
      {variant !== 'wordmark' && markSvg}

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`font-display font-bold tracking-tight text-[#F3F5FA] ${config.text}`}>
            VEYLITH
          </span>
          {subBadge && (
            <span
              className={`font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#8B7CFF]/30 bg-[#8B7CFF]/15 text-[#8B7CFF] ${config.badge}`}
            >
              {subBadge}
            </span>
          )}
        </div>

        {showTagline && (
          <span className="text-[11px] font-sans font-medium text-[#737E91] tracking-wide mt-0.5">
            Everything in sync.
          </span>
        )}
      </div>
    </div>
  );
}
