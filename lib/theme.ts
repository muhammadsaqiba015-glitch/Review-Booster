// ReviewBoost design tokens — single source of truth for the UI.
// Dark, premium theme. Use these instead of raw hex/magic numbers.

export const color = {
  // Surfaces (layered elevation)
  bg: '#0A0A0B',          // app background
  surface: '#131316',     // cards
  surfaceRaised: '#1A1A1F', // inputs, raised panels
  surfaceHover: '#202027',

  // Borders
  border: '#26262B',
  borderStrong: '#34343C',

  // Text
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  textFaint: '#71717A',
  textGhost: '#52525B',

  // Brand (emerald)
  primary: '#34D399',
  primaryHover: '#10B981',
  primarySoft: 'rgba(52, 211, 153, 0.12)',
  primaryBorder: 'rgba(52, 211, 153, 0.30)',
  onPrimary: '#04140D',

  // Semantic
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',
  warning: '#FBBF24',
  success: '#34D399',
} as const

// 4px-based spacing scale
export const space = {
  1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px',
  6: '24px', 7: '32px', 8: '40px', 9: '48px', 10: '64px',
} as const

export const radius = {
  sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '28px', pill: '999px',
} as const

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.4)',
  md: '0 4px 16px rgba(0,0,0,0.35)',
  lg: '0 12px 40px rgba(0,0,0,0.45)',
  glow: '0 8px 30px rgba(16, 185, 129, 0.25)',
} as const

export const font = {
  // Inter is loaded in layout.tsx via next/font and exposed as --font-sans
  sans: "var(--font-sans), system-ui, -apple-system, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace",
} as const

export const text = {
  // size / lineHeight / weight presets
  display: { fontSize: '34px', lineHeight: '1.1', fontWeight: 700, letterSpacing: '-0.02em' },
  h1: { fontSize: '26px', lineHeight: '1.2', fontWeight: 700, letterSpacing: '-0.02em' },
  h2: { fontSize: '20px', lineHeight: '1.25', fontWeight: 600, letterSpacing: '-0.01em' },
  h3: { fontSize: '16px', lineHeight: '1.35', fontWeight: 600 },
  body: { fontSize: '15px', lineHeight: '1.6', fontWeight: 400 },
  small: { fontSize: '13px', lineHeight: '1.5', fontWeight: 400 },
  tiny: { fontSize: '12px', lineHeight: '1.4', fontWeight: 500 },
  label: { fontSize: '13px', lineHeight: '1.4', fontWeight: 500, letterSpacing: '0.01em' },
} as const

export const transition = {
  base: '160ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '240ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const
