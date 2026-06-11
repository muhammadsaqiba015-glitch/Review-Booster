'use client'
import { useState, useEffect } from 'react'

interface Coupon {
  code: string
  status: 'pending' | 'active' | 'redeemed' | 'expired'
  expires_at: string | null
  businesses: {
    name: string
    discount_pct: number
  }
}

interface Props {
  coupon: Coupon
}

export default function CouponScreen({ coupon: initialCoupon }: Props) {
  const [coupon, setCoupon] = useState(initialCoupon)
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [tick, setTick] = useState(0)

  const { status, code, businesses } = coupon
  const isValid = status === 'active'
  const isRedeemed = status === 'redeemed'
  const isExpired = status === 'expired'

  // Live tick every 5 seconds to show screen is live (not a screenshot)
  useEffect(() => {
    if (!isValid) return
    const interval = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(interval)
  }, [isValid])

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  async function handleRedeem() {
    if (pin.length !== 4) { setPinError('Enter a 4-digit PIN'); return }
    setRedeeming(true)
    setPinError('')
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, pin }),
      })
      const data = await res.json()
      if (!res.ok) { setPinError(data.error || 'Invalid PIN'); setRedeeming(false); return }
      setCoupon(prev => ({ ...prev, status: 'redeemed' }))
      setShowPin(false)
    } catch {
      setPinError('Something went wrong. Try again.')
    } finally {
      setRedeeming(false)
    }
  }

  const expiryDate = coupon.expires_at
    ? new Date(coupon.expires_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const cardStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: isValid ? '#16a34a' : '#dc2626',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui, sans-serif',
  }

  const boxStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '28px',
    padding: '40px 32px',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.2)',
  }

  if (status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '24px', padding: '48px 32px', maxWidth: '380px', width: '100%', textAlign: 'center', border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 12px' }}>Review pending</h1>
          <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            Your coupon will be sent via SMS once verified.
          </p>
        </div>
      </div>
    )
  }

  // PIN entry overlay
  if (showPin) {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 8px' }}>
            Staff PIN Required
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '0 0 24px' }}>
            Enter the 4-digit PIN provided by the business owner
          </p>

          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError('') }}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '12px',
              border: `2px solid ${pinError ? '#fca5a5' : 'rgba(255,255,255,0.3)'}`,
              background: 'rgba(0,0,0,0.2)',
              color: '#fff',
              fontSize: '28px',
              textAlign: 'center',
              letterSpacing: '12px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '8px',
            }}
            autoFocus
          />

          {pinError && <p style={{ color: '#fca5a5', fontSize: '13px', margin: '0 0 16px' }}>{pinError}</p>}

          <button
            onClick={handleRedeem}
            disabled={redeeming || pin.length !== 4}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              background: redeeming || pin.length !== 4 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)',
              color: '#16a34a',
              fontSize: '16px',
              fontWeight: '700',
              cursor: redeeming || pin.length !== 4 ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
            }}
          >
            {redeeming ? 'Verifying...' : 'Confirm Redemption'}
          </button>

          <button
            onClick={() => { setShowPin(false); setPin(''); setPinError('') }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={boxStyle}>

        {/* Live clock — proves this is a live screen, not a screenshot */}
        {isValid && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '6px 12px', display: 'inline-block', marginBottom: '16px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: 'monospace' }}>
              🟢 Live · {timeStr}
            </span>
          </div>
        )}

        <div style={{ fontSize: '64px', marginBottom: '12px' }}>
          {isValid ? '✅' : '❌'}
        </div>

        <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          {isValid ? 'VALID' : isRedeemed ? 'USED' : 'EXPIRED'}
        </h1>

        {isValid && (
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '20px', margin: '16px 0' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '0 0 6px' }}>{businesses.name}</p>
            <p style={{ color: '#fff', fontSize: '44px', fontWeight: '800', margin: '0 0 4px', letterSpacing: '-1px' }}>
              {businesses.discount_pct}% OFF
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>Apply to this bill</p>
          </div>
        )}

        {!isValid && (
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', margin: '16px 0' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '0 0 4px' }}>{businesses.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
              {isRedeemed ? 'This coupon has already been used' : 'This coupon has expired'}
            </p>
          </div>
        )}

        {/* Coupon code */}
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '12px 20px', display: 'inline-block', marginBottom: '16px' }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '24px', fontWeight: '700', letterSpacing: '4px', fontFamily: 'monospace' }}>
            {code}
          </span>
        </div>

        {isValid && expiryDate && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 20px' }}>
            Valid until {expiryDate}
          </p>
        )}

        {isValid && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600', margin: '0 0 16px' }}>
              Show this screen to staff before your bill is made
            </p>
            <button
              onClick={() => setShowPin(true)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.4)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              🔐 Redeem at Counter (Staff only)
            </button>
          </>
        )}
      </div>
    </div>
  )
}
