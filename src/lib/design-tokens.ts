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
  sidebar: "var(--color-sidebar)",
  sidebarHover: "var(--color-sidebar-hover)",
  sidebarActive: "var(--color-sidebar-active)",
  sidebarText: "var(--color-sidebar-text)",
  sidebarTextActive: "var(--color-sidebar-text-active)",
  sidebarMuted: "var(--color-sidebar-muted)",
  sidebarSubtext: "var(--color-sidebar-subtext)",
  sidebarQuote: "var(--color-sidebar-quote)",

  // Workspace & Surfaces
  background: "var(--color-background)",
  surface: "var(--color-surface)",
  surfaceSubtle: "var(--color-surface-subtle)",
  surfaceHover: "var(--color-surface-hover)",
  codeBg: "var(--color-code-bg)",

  // Primary Brand & Accents
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primary-hover)",
  brandAccent: "var(--color-brand-accent)", // Logo badge coral
  streak: "var(--color-streak)", // Activity / streak flame orange
  lavender: "var(--color-lavender)",
  lavenderText: "var(--color-lavender-text)",
  lavenderBorder: "var(--color-lavender-border)",

  // Avatar Color Schemes
  avatar: {
    purple: "var(--avatar-purple)",
    orange: "var(--avatar-orange)",
    blue: "var(--avatar-blue)",
    teal: "var(--avatar-teal)",
    green: "var(--avatar-green)",
  },

  // Typography / Neutrals
  text: "var(--color-text)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-muted)",
  textFaint: "var(--color-text-faint)",
  border: "var(--color-border)",
  borderSubtle: "var(--color-border-subtle)",

  // Status & Semantic Feedback
  success: {
    bg: "var(--color-success-bg)",
    text: "var(--color-success-text)",
    border: "var(--color-success-border)",
    dot: "var(--color-success-dot)",
  },
  warning: {
    bg: "var(--color-warning-bg)",
    text: "var(--color-warning-text)",
    border: "var(--color-warning-border)",
    dot: "var(--color-warning-dot)",
  },
  danger: {
    bg: "var(--color-danger-bg)",
    text: "var(--color-danger-text)",
    border: "var(--color-danger-border)",
    dot: "var(--color-danger-dot)",
  },
  info: {
    bg: "var(--color-info-bg)",
    text: "var(--color-info-text)",
    border: "var(--color-info-border)",
    dot: "var(--color-info-dot)",
  },
} as const;

export const typography = {
  fontSans: "var(--font-sans)",
  fontMono: "var(--font-mono, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace)",
} as const;

export const radii = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  full: "var(--radius-full)",
} as const;
export const shadows = {
  card: "var(--shadow-card)",
  cardHover: "var(--shadow-card-hover)",
  modal: "var(--shadow-modal)",
} as const;
export const typeScale = {
  caption: "var(--text-caption)",
  label: "var(--text-label)",
  body: "var(--text-body)",
  title: "var(--text-title)",
  heading: "var(--text-heading)",
  leading: "var(--leading-body)",
  tracking: "var(--tracking-heading)",
} as const;
export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

/** Reserved shell measurements: this stage does not construct a workspace shell. */
export const layout = {
  sidebar: 174,
  header: 56.25,
  pagePadding: 25.5,
  cardGap: 13.5,
  panelRadius: 12.75,
  taskThumbnail: { width: 79.5, height: 75 },
  taskCardHeight: 182.25,
} as const;
export const spacing = {
  xs: "var(--space-1)",
  sm: "var(--space-2)",
  md: "var(--space-3)",
  lg: "var(--space-4)",
  xl: "var(--space-6)",
} as const;
export const controls = {
  small: "var(--control-sm)",
  medium: "var(--control-md)",
  large: "var(--control-lg)",
  touch: "var(--control-touch)",
} as const;
export const icons = {
  small: "var(--icon-sm)",
  medium: "var(--icon-md)",
  large: "var(--icon-lg)",
  stroke: "var(--icon-stroke)",
} as const;
export const focus = { ring: "var(--focus-ring)", offset: "var(--focus-offset)" } as const;
export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;
