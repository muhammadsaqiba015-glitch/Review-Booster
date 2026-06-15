'use client'
import { useState, useEffect } from 'react'
import { CenteredPage, Card, IconBadge, Title, Subtitle, Button, Input, color, radius, space, text, shadow } from '@/components/ui'
import { Gift, CheckCircle, XCircle, Lock, Check } from '@/components/icons'

interface Coupon {
  code: string
  status: 'pending' | 'active' | 'redeemed' | 'expired'
  expires_at: string | null
  businesses: { name: string; discount_pct: number }
}

export default function CouponScreen({ coupon: initialCoupon }: { coupon: Coupon }) {
  const [coupon, setCoupon] = useState(initialCoupon)
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [, setTick] = useState(0)

  const { status, code, businesses } = coupon
  const isValid = status === 'active'
  const isRedeemed = status === 'redeemed'

  useEffect(() => {
    if (!isValid) return
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [isValid])

  const timeStr = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const expiry = coupon.expires_at
    ? new Date(coupon.expires_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  async function handleRedeem() {
    if (pin.length !== 4) { setPinError('Enter the 4-digit PIN'); return }
    setRedeeming(true); setPinError('')
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, pin }),
      })
      const data = await res.json()
      if (!res.ok) { setPinError(data.error || 'Invalid PIN'); setRedeeming(false); return }
      setCoupon(prev => ({ ...prev, status: 'redeemed' }))
      setShowPin(false)
    } catch {
      setPinError('Something went wrong. Try again.')
    } finally { setRedeeming(false) }
  }

  /* ---------- Pending ---------- */
  if (status === 'pending') {
    return (
      <CenteredPage>
        <Card style={{ textAlign: 'center' }}>
          <IconBadge tone="neutral"><Gift size={24} /></IconBadge>
          <Title style={{ marginTop: space[5] }}>Review pending</Title>
          <Subtitle style={{ marginTop: space[2] }}>Your coupon will be sent via WhatsApp once your review is verified.</Subtitle>
        </Card>
      </CenteredPage>
    )
  }

  /* ---------- PIN entry ---------- */
  if (showPin) {
    return (
      <CenteredPage>
        <Card className="rb-fade-up" style={{ textAlign: 'center' }}>
          <IconBadge><Lock size={24} /></IconBadge>
          <Title style={{ marginTop: space[5] }}>Staff PIN required</Title>
          <Subtitle style={{ marginTop: space[2], marginBottom: space[6], ...text.small }}>
            Ask the staff to enter the 4-digit redemption PIN.
          </Subtitle>

          <Input
            type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin} autoFocus
            invalid={!!pinError}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError('') }}
            style={{ fontSize: '28px', textAlign: 'center', letterSpacing: '0.5em', fontWeight: 700 }}
          />
          {pinError && <p style={{ ...text.small, color: color.danger, margin: `${space[3]} 0 0` }}>{pinError}</p>}

          <div style={{ marginTop: space[5], display: 'flex', flexDirection: 'column', gap: space[2] }}>
            <Button onClick={handleRedeem} loading={redeeming} disabled={pin.length !== 4}>Confirm redemption</Button>
            <Button variant="ghost" onClick={() => { setShowPin(false); setPin(''); setPinError('') }}>Cancel</Button>
          </div>
        </Card>
      </CenteredPage>
    )
  }

  /* ---------- Valid / redeemed / expired ---------- */
  const accent = isValid ? color.primary : color.danger
  return (
    <CenteredPage>
      <Card className="rb-pop" style={{
        textAlign: 'center',
        background: isValid ? `linear-gradient(165deg, rgba(52,211,153,0.10), ${color.surface} 45%)` : color.surface,
        border: `1px solid ${isValid ? color.primaryBorder : color.border}`,
        boxShadow: isValid ? shadow.glow : shadow.lg,
      }}>
        {isValid && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: space[2], margin: `0 auto ${space[4]}`,
            background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.pill, padding: '6px 12px',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color.primary, boxShadow: `0 0 8px ${color.primary}` }} />
            <span className="tnum" style={{ ...text.tiny, fontWeight: 500, color: color.textMuted }}>Live · {timeStr}</span>
          </div>
        )}

        <IconBadge tone={isValid ? 'primary' : 'neutral'}>
          {isValid ? <CheckCircle size={26} /> : <XCircle size={26} color={color.danger} />}
        </IconBadge>

        <h1 style={{ ...text.display, color: isValid ? color.primary : color.danger, margin: `${space[5]} 0 ${space[1]}` }}>
          {isValid ? 'VALID' : isRedeemed ? 'USED' : 'EXPIRED'}
        </h1>
        <Subtitle style={{ ...text.small, marginBottom: space[5] }}>{businesses.name}</Subtitle>

        {isValid && (
          <div style={{ background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.lg, padding: `${space[5]} ${space[4]}`, marginBottom: space[4] }}>
            <div className="tnum" style={{ fontSize: '46px', fontWeight: 700, color: color.primary, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {businesses.discount_pct}% OFF
            </div>
            <p style={{ ...text.small, color: color.textMuted, margin: `${space[2]} 0 0` }}>Apply to this bill</p>
          </div>
        )}

        <div className="tnum" style={{
          fontFamily: 'ui-monospace, monospace', fontSize: '22px', fontWeight: 700, color: isValid ? color.text : color.textMuted,
          letterSpacing: '0.18em', background: color.surfaceRaised, border: `1px dashed ${color.borderStrong}`,
          borderRadius: radius.md, padding: `${space[3]} ${space[4]}`, marginBottom: space[4],
        }}>
          {code}
        </div>

        {isValid ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space[2], color: color.textMuted, ...text.small, marginBottom: expiry ? space[1] : space[5] }}>
              <Check size={16} color={color.primary} /> Show to staff before your bill
            </div>
            {expiry && <p style={{ ...text.tiny, color: color.textGhost, fontWeight: 400, margin: `0 0 ${space[5]}` }}>Valid until {expiry}</p>}
            <Button variant="secondary" onClick={() => setShowPin(true)}>
              <Lock size={16} /> Redeem at counter (staff)
            </Button>
          </>
        ) : (
          <p style={{ ...text.small, color: color.textMuted, margin: 0 }}>
            {isRedeemed ? 'This coupon has already been used.' : 'This coupon has expired.'}
          </p>
        )}
      </Card>
    </CenteredPage>
  )
}
