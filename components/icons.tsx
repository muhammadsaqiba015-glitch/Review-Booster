// Lightweight inline SVG icons (Lucide-style, 1.75 stroke) — replaces emojis.
import type { CSSProperties } from 'react'

interface IconProps {
  size?: number
  color?: string
  style?: CSSProperties
  strokeWidth?: number
}

function base(size: number, strokeWidth: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

export function Star({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function Pencil({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function Camera({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

export function Gift({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" />
    </svg>
  )
}

export function Ticket({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  )
}

export function Lock({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function Check({ size = 24, color = 'currentColor', style, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function CheckCircle({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m22 4-10 10.01-3-3" />
    </svg>
  )
}

export function XCircle({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  )
}

export function Copy({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function Store({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M3 9.5 4.5 4h15L21 9.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 9.5Z" />
      <path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
      <path d="M9 20v-5h6v5" />
    </svg>
  )
}

export function ArrowRight({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export function ArrowLeft({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

export function Download({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

export function Refresh({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  )
}

export function Image({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5a2 2 0 0 0-3 0L5 21" />
    </svg>
  )
}

export function Phone({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

export function LogOut({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  )
}

export function QrCode({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM21 14v3M14 21h7" />
    </svg>
  )
}

export function Calculator({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14v4M8 18h4" />
    </svg>
  )
}

export function Sparkles({ size = 24, color = 'currentColor', style, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} style={{ color, ...style }}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
    </svg>
  )
}
