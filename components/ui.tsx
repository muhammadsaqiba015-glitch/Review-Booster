'use client'
import { useState, type CSSProperties, type ReactNode, type InputHTMLAttributes } from 'react'
import { color, radius, shadow, space, font, text, transition } from '@/lib/theme'

/* ---------- Page shells ---------- */

export function CenteredPage({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: `radial-gradient(120% 80% at 50% -10%, #131316 0%, ${color.bg} 55%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: space[6],
    }}>
      {children}
    </div>
  )
}

export function Card({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius['2xl'],
        boxShadow: shadow.lg,
        padding: `${space[8]} ${space[6]}`,
        width: '100%',
        maxWidth: '400px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: color.surface,
      border: `1px solid ${color.border}`,
      borderRadius: radius.lg,
      padding: space[5],
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ---------- Icon badge (replaces emoji headers) ---------- */

export function IconBadge({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'neutral' }) {
  const isPrimary = tone === 'primary'
  return (
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: radius.lg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      background: isPrimary ? color.primarySoft : color.surfaceRaised,
      border: `1px solid ${isPrimary ? color.primaryBorder : color.border}`,
      color: isPrimary ? color.primary : color.textMuted,
    }}>
      {children}
    </div>
  )
}

/* ---------- Typography ---------- */

export function Title({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <h1 style={{ ...text.h1, color: color.text, margin: 0, ...style }}>{children}</h1>
}

export function Subtitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ ...text.body, color: color.textMuted, margin: 0, ...style }}>{children}</p>
}

/* ---------- Button ---------- */

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
  type?: 'button' | 'submit'
  style?: CSSProperties
}

export function Button({
  children, onClick, disabled, loading,
  variant = 'primary', fullWidth = true, type = 'button', style,
}: ButtonProps) {
  const [hover, setHover] = useState(false)
  const isDisabled = disabled || loading

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: isDisabled ? color.surfaceRaised : hover ? color.primaryHover : color.primary,
      color: isDisabled ? color.textGhost : color.onPrimary,
      border: '1px solid transparent',
      boxShadow: isDisabled ? 'none' : hover ? shadow.glow : 'none',
    },
    secondary: {
      background: hover && !isDisabled ? color.surfaceHover : color.surfaceRaised,
      color: color.text,
      border: `1px solid ${color.border}`,
    },
    ghost: {
      background: 'transparent',
      color: color.textMuted,
      border: '1px solid transparent',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[2],
        padding: '14px 20px',
        borderRadius: radius.md,
        fontSize: '15px',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: `background ${transition.base}, box-shadow ${transition.base}, transform ${transition.base}`,
        transform: hover && !isDisabled ? 'translateY(-1px)' : 'none',
        ...variants[variant],
        ...style,
      }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export function Spinner({ size = 16, c }: { size?: number; c?: string }) {
  return (
    <span style={{
      width: size,
      height: size,
      border: `2px solid ${c ?? 'rgba(255,255,255,0.35)'}`,
      borderTopColor: c ?? color.onPrimary,
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'rb-spin 0.6s linear infinite',
    }} />
  )
}

/* ---------- Form field ---------- */

type FieldProps = {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div style={{ textAlign: 'left' }}>
      <label style={{ ...text.label, color: color.textMuted, display: 'block', marginBottom: space[2] }}>
        {label}
      </label>
      {children}
      {error
        ? <p style={{ ...text.tiny, color: color.danger, margin: `${space[2]} 0 0` }}>{error}</p>
        : hint
          ? <p style={{ ...text.tiny, color: color.textGhost, fontWeight: 400, margin: `${space[2]} 0 0` }}>{hint}</p>
          : null}
    </div>
  )
}

export function Input({ invalid, style, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      {...props}
      onFocus={(e) => { setFocus(true); props.onFocus?.(e) }}
      onBlur={(e) => { setFocus(false); props.onBlur?.(e) }}
      style={{
        width: '100%',
        padding: '13px 15px',
        borderRadius: radius.md,
        border: `1px solid ${invalid ? color.danger : focus ? color.primaryBorder : color.border}`,
        background: color.surfaceRaised,
        color: color.text,
        fontSize: '16px', // 16px avoids iOS zoom
        outline: 'none',
        boxShadow: focus && !invalid ? `0 0 0 3px ${color.primarySoft}` : 'none',
        transition: `border-color ${transition.base}, box-shadow ${transition.base}`,
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

export { color, radius, shadow, space, font, text, transition }
