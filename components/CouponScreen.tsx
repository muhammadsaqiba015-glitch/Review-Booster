'use client'

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

export default function CouponScreen({ coupon }: Props) {
  const { status, code, businesses } = coupon
  const isValid = status === 'active'
  const isRedeemed = status === 'redeemed'
  const isPending = status === 'pending'

  const bg = isValid ? '#16a34a' : '#dc2626'
  const lightBg = isValid ? '#dcfce7' : '#fee2e2'

  if (isPending) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          background: '#1a1a1a',
          borderRadius: '24px',
          padding: '48px 32px',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid #2a2a2a',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 12px' }}>
            Review pending
          </h1>
          <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            We haven't detected your review yet. It can take a few minutes.
            You'll get an SMS with your coupon once it's verified.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        borderRadius: '28px',
        padding: '48px 32px',
        maxWidth: '380px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.2)',
      }}>

        {/* Big icon */}
        <div style={{ fontSize: '72px', marginBottom: '16px' }}>
          {isValid ? '✅' : '❌'}
        </div>

        {/* Status */}
        <h1 style={{
          color: '#fff',
          fontSize: '32px',
          fontWeight: '700',
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
        }}>
          {isValid ? 'VALID' : isRedeemed ? 'USED' : 'EXPIRED'}
        </h1>

        {isValid && (
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '20px',
            margin: '20px 0',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '0 0 6px' }}>
              {businesses.name}
            </p>
            <p style={{
              color: '#fff',
              fontSize: '40px',
              fontWeight: '800',
              margin: '0 0 4px',
              letterSpacing: '-1px',
            }}>
              {businesses.discount_pct}% OFF
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>
              Apply to this bill
            </p>
          </div>
        )}

        {/* Coupon code */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'inline-block',
          marginBottom: '20px',
        }}>
          <span style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '4px',
            fontFamily: 'monospace',
          }}>
            {code}
          </span>
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px',
          margin: 0,
          lineHeight: '1.5',
        }}>
          {isValid
            ? 'Show this screen to staff before your bill is made'
            : isRedeemed
            ? 'This coupon has already been used'
            : 'This coupon has expired'}
        </p>
      </div>
    </div>
  )
}
