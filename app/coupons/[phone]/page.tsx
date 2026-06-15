'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { color, radius, space, text } from '@/components/ui'
import { Ticket, ArrowRight, XCircle, Check } from '@/components/icons'

interface Coupon {
  code: string
  status: 'active' | 'redeemed' | 'expired' | 'pending'
  expires_at: string | null
  activated_at: string | null
  businesses: { name: string; discount_pct: number; slug: string }
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

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const active = coupons.filter(c => c.status === 'active')
  const past = coupons.filter(c => c.status !== 'active')

  return (
    <div style={{ minHeight: '100dvh', background: color.bg, padding: `${space[8]} ${space[5]}`, fontFamily: 'var(--font-sans), system-ui' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        <header style={{ marginBottom: space[7] }}>
          <h1 style={{ ...text.h1, color: color.text, margin: `0 0 ${space[1]}` }}>My Coupons</h1>
          <p style={{ ...text.small, color: color.textFaint, margin: 0 }}>All your review rewards in one place</p>
        </header>

        {loading ? (
          <p style={{ ...text.small, color: color.textFaint, textAlign: 'center', padding: `${space[8]} 0` }}>Loading…</p>
        ) : coupons.length === 0 ? (
          <div style={{ background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.lg, padding: `${space[9]} ${space[6]}`, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', marginBottom: space[3], color: color.textFaint }}><Ticket size={32} /></div>
            <p style={{ ...text.small, color: color.textMuted, margin: 0 }}>No coupons yet. Leave a review at a business to earn one.</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section style={{ marginBottom: space[8] }}>
                <p style={{ ...text.tiny, color: color.primary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: `0 0 ${space[3]}` }}>
                  Active — {active.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
                  {active.map(c => (
                    <a key={c.code} href={`/coupon/${c.code}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: `linear-gradient(135deg, rgba(52,211,153,0.08), ${color.surface} 60%)`,
                        border: `1px solid ${color.primaryBorder}`, borderRadius: radius.lg, padding: space[5],
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: space[4],
                      }}>
                        <div>
                          <p style={{ ...text.h3, color: color.text, margin: `0 0 ${space[1]}` }}>{c.businesses.name}</p>
                          <p className="tnum" style={{ fontSize: '24px', fontWeight: 700, color: color.primary, margin: `0 0 ${space[1]}`, letterSpacing: '-0.02em' }}>
                            {c.businesses.discount_pct}% OFF
                          </p>
                          <p className="tnum" style={{ ...text.tiny, fontFamily: 'ui-monospace, monospace', color: color.textFaint, letterSpacing: '0.12em', margin: 0 }}>
                            {c.code}{c.expires_at ? ` · exp ${fmt(c.expires_at)}` : ''}
                          </p>
                        </div>
                        <ArrowRight size={20} color={color.primary} />
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <p style={{ ...text.tiny, color: color.textGhost, textTransform: 'uppercase', letterSpacing: '0.08em', margin: `0 0 ${space[3]}` }}>
                  Past — {past.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                  {past.map(c => (
                    <div key={c.code} style={{
                      background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md,
                      padding: `${space[4]} ${space[5]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7,
                    }}>
                      <div>
                        <p style={{ ...text.small, fontWeight: 600, color: color.textMuted, margin: `0 0 2px` }}>{c.businesses.name}</p>
                        <p className="tnum" style={{ ...text.tiny, fontFamily: 'ui-monospace, monospace', color: color.textGhost, letterSpacing: '0.12em', margin: 0 }}>{c.code}</p>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: space[1], ...text.tiny, color: c.status === 'redeemed' ? color.textMuted : color.danger }}>
                        {c.status === 'redeemed' ? <><Check size={14} /> Used</> : <><XCircle size={14} /> Expired</>}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
