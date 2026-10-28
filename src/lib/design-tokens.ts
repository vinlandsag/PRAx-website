/**
 * src/lib/design-tokens.ts
 *
 * Centralized design tokens for the PRAX UI design system.
 * Source of truth: PRAX_Redesigned_High_Fidelity_Desktop_UI.pdf
 *
 * Rule: Do not scatter arbitrary hex values across components.
 * Reference these tokens or their corresponding CSS variables/Tailwind utility classes.
 */

export const colors = {
  // Navigation / Shell
  sidebar: "#171B2A",
  sidebarHover: "#22273B",
  sidebarActive: "#292F45",
  sidebarText: "#8F95B2",
  sidebarTextActive: "#FFFFFF",
  sidebarMuted: "#666D8F",
  sidebarSubtext: "#7B82A6",
  sidebarQuote: "#A6ACCD",

  // Workspace & Surfaces
  background: "#F7F6F4",
  surface: "#FFFFFF",
  surfaceSubtle: "#FBFBFB",
  surfaceHover: "#F6F5F8",
  codeBg: "#171B2A",

  // Primary Brand & Accents
  primary: "#6254E8",
  primaryHover: "#5143D4",
  brandAccent: "#FF5C35", // Logo badge coral
  streak: "#F97316", // Activity / streak flame orange
  lavender: "#EEE9FF",
  lavenderText: "#5443DC",
  lavenderBorder: "#DDD4FB",

  // Avatar Color Schemes
  avatar: {
    purple: "#6254E8",
    orange: "#F97316",
    blue: "#3B82F6",
    teal: "#0D9488",
    green: "#16A34A",
  },

  // Typography / Neutrals
  text: "#20212B",
  textSecondary: "#4A4B57",
  textMuted: "#777887",
  textFaint: "#A3A4B0",
  border: "#E9E7ED",
  borderSubtle: "#F0EEF4",

  // Status & Semantic Feedback
  success: {
    bg: "#DDF5E9",
    text: "#15803D",
    border: "#B9EBCF",
    dot: "#16A34A",
  },
  warning: {
    bg: "#FFF0D9",
    text: "#B45309",
    border: "#FDE0B5",
    dot: "#F59E0B",
  },
  danger: {
    bg: "#FCE5E5",
    text: "#DC2626",
    border: "#F8B8B8",
    dot: "#EF4444",
  },
  info: {
    bg: "#EBF3FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
    dot: "#3B82F6",
  },
} as const;

export const typography = {
  fontSans: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
  fontMono: "var(--font-mono, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace)",
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  full: "9999px",
} as const;

export const shadows = {
  card: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
  cardHover: "0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)",
  modal: "0 20px 40px -15px rgba(17, 24, 39, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
} as const;
