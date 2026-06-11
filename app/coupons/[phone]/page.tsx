'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Coupon {
  code: string
  status: 'active' | 'redeemed' | 'expired' | 'pending'
  expires_at: string | null
  activated_at: string | null
  businesses: {
    name: string
    discount_pct: number
    slug: string
  }
}

export default function CouponWallet() {
  const params = useParams()
  const phone = params.phone as string
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/coupons?phone=${phone}`)
      .then(r => r.json())
      .then(data => { setCoupons(data.coupons || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [phone])

  const cardStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0f0f0f',
    padding: '32px 20px',
    fontFamily: 'system-ui, sans-serif',
  }

  function statusColor(status: string) {
    if (status === 'active') return '#4ade80'
    if (status === 'redeemed') return '#888'
    return '#f87171'
  }

  function statusLabel(status: string) {
    if (status === 'active') return '✅ Valid'
    if (status === 'redeemed') return '✓ Used'
    if (status === 'expired') return '✗ Expired'
    return '⏳ Pending'
  }

  function formatDate(date: string | null) {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const activeCoupons = coupons.filter(c => c.status === 'active')
  const usedCoupons = coupons.filter(c => c.status !== 'active')

  return (
    <div style={cardStyle}>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>
            My Coupons
          </h1>
          <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>
            All your review rewards in one place
          </p>
        </div>

        {loading ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '40px 0' }}>Loading...</p>
        ) : coupons.length === 0 ? (
          <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', border: '1px solid #2a2a2a' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎟️</div>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>No coupons yet. Leave a review at a business to earn one.</p>
          </div>
        ) : (
          <>
            {activeCoupons.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>
                  Active — {activeCoupons.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeCoupons.map(c => (
                    <a
                      key={c.code}
                      href={`/coupon/${c.code}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        background: '#1a1a1a',
                        border: '1px solid #2d4a2d',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>
                            {c.businesses.name}
                          </p>
                          <p style={{ color: '#4ade80', fontSize: '24px', fontWeight: '800', margin: '0 0 4px' }}>
                            {c.businesses.discount_pct}% OFF
                          </p>
                          <p style={{ color: '#555', fontSize: '12px', margin: 0, fontFamily: 'monospace', letterSpacing: '2px' }}>
                            {c.code}
                          </p>
                          {c.expires_at && (
                            <p style={{ color: '#555', fontSize: '11px', margin: '4px 0 0' }}>
                              Expires {formatDate(c.expires_at)}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600' }}>Tap to open →</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {usedCoupons.length > 0 && (
              <div>
                <p style={{ color: '#444', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>
                  Past — {usedCoupons.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {usedCoupons.map(c => (
                    <div key={c.code} style={{
                      background: '#141414',
                      border: '1px solid #2a2a2a',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: 0.6,
                    }}>
                      <div>
                        <p style={{ color: '#888', fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>
                          {c.businesses.name}
                        </p>
                        <p style={{ color: '#666', fontSize: '12px', margin: 0, fontFamily: 'monospace', letterSpacing: '2px' }}>
                          {c.code}
                        </p>
                      </div>
                      <span style={{ color: statusColor(c.status), fontSize: '12px', fontWeight: '600' }}>
                        {statusLabel(c.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
