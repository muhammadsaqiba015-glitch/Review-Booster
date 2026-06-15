'use client'
import { useState, useRef } from 'react'
import { CenteredPage, Card, IconBadge, Title, Subtitle, Button, Field, Input, color, radius, space, text, shadow } from '@/components/ui'
import { Star, Pencil, Camera, Gift, ArrowRight, Image as ImageIcon, Check, Phone } from '@/components/icons'

interface Props {
  business: {
    id: string
    name: string
    slug: string
    google_review_url: string
    discount_pct: number
  }
}

type Step = 'form' | 'reviewing' | 'uploading' | 'coupon'
const STEP_INDEX: Record<Step, number> = { form: 0, reviewing: 1, uploading: 2, coupon: 3 }

function Stepper({ current }: { current: Step }) {
  const idx = STEP_INDEX[current]
  return (
    <div style={{ display: 'flex', gap: space[2], justifyContent: 'center', marginBottom: space[6] }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          height: '4px',
          width: i === idx ? '28px' : '8px',
          borderRadius: radius.pill,
          background: i <= idx ? color.primary : color.border,
          transition: 'all 240ms cubic-bezier(0.4,0,0.2,1)',
        }} />
      ))}
    </div>
  )
}

export default function ScanPage({ business }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [submissionId, setSubmissionId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; discountPct: number; businessName: string; expiresAt: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validateForm() {
    let ok = true
    if (!name || name.trim().length < 2) { setNameError('Please enter your name'); ok = false } else setNameError('')
    if (!phone || phone.replace(/\D/g, '').length < 10) { setPhoneError('Enter a valid phone number'); ok = false } else setPhoneError('')
    return ok
  }

  async function handleFormSubmit() {
    if (!validateForm()) return
    window.open(business.google_review_url, '_blank') // sync open before await (mobile popup rule)
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, customerName: name, customerPhone: phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      setSubmissionId(data.submissionId)
      setStep('reviewing')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshot(file); setPreviewUrl(URL.createObjectURL(file)); setUploadError('')
  }

  async function handleClaimCoupon() {
    if (!screenshot) { setUploadError('Please upload a screenshot of your review'); return }
    setLoading(true); setUploadError('')
    try {
      const formData = new FormData()
      formData.append('submissionId', submissionId)
      formData.append('screenshot', screenshot)
      const res = await fetch('/api/submission/claim-coupon', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error || 'Something went wrong'); setLoading(false); return }
      setCoupon({ code: data.couponCode, discountPct: data.discountPct, businessName: data.businessName, expiresAt: data.expiresAt })
      setStep('coupon')
    } catch {
      setUploadError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  /* ---------- Step 1: form ---------- */
  if (step === 'form') {
    return (
      <CenteredPage>
        <Card className="rb-fade-up">
          <Stepper current={step} />
          <div style={{ textAlign: 'center' }}>
            <IconBadge><Star size={26} /></IconBadge>
            <Title style={{ marginTop: space[5], ...text.h1 }}>Review {business.name}</Title>
            <Subtitle style={{ marginTop: space[2], marginBottom: space[7] }}>
              Leave a quick Google review and get{' '}
              <span style={{ color: color.primary, fontWeight: 600 }}>{business.discount_pct}% off</span> your next visit.
            </Subtitle>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
            <Field label="Your name" error={nameError}>
              <Input placeholder="Ali Hassan" value={name} invalid={!!nameError}
                onChange={e => { setName(e.target.value); setNameError('') }} />
            </Field>
            <Field label="Your WhatsApp number" hint="Your coupon link is sent here" error={phoneError}>
              <Input type="tel" inputMode="tel" placeholder="03XX-XXXXXXX" value={phone} invalid={!!phoneError}
                onChange={e => { setPhone(e.target.value); setPhoneError('') }}
                onKeyDown={e => e.key === 'Enter' && handleFormSubmit()} />
            </Field>
          </div>

          {error && <p style={{ ...text.small, color: color.danger, margin: `${space[4]} 0 0`, textAlign: 'center' }}>{error}</p>}

          <div style={{ marginTop: space[6] }}>
            <Button onClick={handleFormSubmit} loading={loading}>
              {loading ? 'Opening Google…' : <>Leave a Review <ArrowRight size={18} /></>}
            </Button>
          </div>
        </Card>
      </CenteredPage>
    )
  }

  /* ---------- Step 2: reviewing ---------- */
  if (step === 'reviewing') {
    return (
      <CenteredPage>
        <Card className="rb-fade-up">
          <Stepper current={step} />
          <div style={{ textAlign: 'center' }}>
            <IconBadge><Pencil size={24} /></IconBadge>
            <Title style={{ marginTop: space[5] }}>Write your review</Title>
            <Subtitle style={{ marginTop: space[2], marginBottom: space[6] }}>
              Post your review on Google, then come back and upload a screenshot to claim your reward.
            </Subtitle>
          </div>
          <Button onClick={() => setStep('uploading')}>I&apos;ve posted my review <ArrowRight size={18} /></Button>
          <div style={{ marginTop: space[3] }}>
            <Button variant="ghost" onClick={() => window.open(business.google_review_url, '_blank')}>
              Reopen Google review
            </Button>
          </div>
        </Card>
      </CenteredPage>
    )
  }

  /* ---------- Step 3: upload ---------- */
  if (step === 'uploading') {
    return (
      <CenteredPage>
        <Card className="rb-fade-up">
          <Stepper current={step} />
          <div style={{ textAlign: 'center' }}>
            <IconBadge><Camera size={24} /></IconBadge>
            <Title style={{ marginTop: space[5] }}>Upload your screenshot</Title>
            <Subtitle style={{ marginTop: space[2], marginBottom: space[5], ...text.small }}>
              Snap your posted Google review so we can verify it.
            </Subtitle>
          </div>

          {/* Instructions */}
          <div style={{ background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: space[4], marginBottom: space[5] }}>
            <p style={{ ...text.tiny, color: color.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', margin: `0 0 ${space[3]}` }}>How to get it</p>
            {['Open Google Maps and find your review', 'Take a screenshot showing your name + review', 'Upload it below'].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: space[3], marginBottom: i < 2 ? space[2] : 0, alignItems: 'flex-start' }}>
                <span style={{ ...text.tiny, color: color.primary, fontWeight: 700, minWidth: '16px' }}>{i + 1}</span>
                <span style={{ ...text.small, color: color.textMuted }}>{s}</span>
              </div>
            ))}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

          {previewUrl ? (
            <div style={{ marginBottom: space[5] }}>
              <img src={previewUrl} alt="Your review screenshot"
                style={{ width: '100%', borderRadius: radius.md, border: `1px solid ${color.border}`, maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
              <button onClick={() => { setScreenshot(null); setPreviewUrl(null) }}
                style={{ marginTop: space[2], background: 'none', border: 'none', color: color.textMuted, ...text.small, cursor: 'pointer', padding: space[1] }}>
                Remove & choose another
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', padding: `${space[7]} ${space[4]}`, borderRadius: radius.md,
                border: `1.5px dashed ${color.borderStrong}`, background: color.bg, color: color.textFaint,
                cursor: 'pointer', marginBottom: space[5], display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: space[2], transition: 'border-color 160ms',
              }}>
              <ImageIcon size={28} color={color.textFaint} />
              <span style={{ ...text.small }}>Tap to select screenshot</span>
            </button>
          )}

          {uploadError && <p style={{ ...text.small, color: color.danger, margin: `0 0 ${space[4]}`, textAlign: 'center' }}>{uploadError}</p>}

          <Button onClick={handleClaimCoupon} loading={loading} disabled={!screenshot}>
            {loading ? 'Verifying…' : <>Get My Coupon <ArrowRight size={18} /></>}
          </Button>
        </Card>
      </CenteredPage>
    )
  }

  /* ---------- Step 4: coupon reveal ---------- */
  if (step === 'coupon' && coupon) {
    const expiry = coupon.expiresAt
      ? new Date(coupon.expiresAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
      : null
    return (
      <CenteredPage>
        <Card className="rb-pop" style={{
          background: `linear-gradient(165deg, rgba(52,211,153,0.10), ${color.surface} 45%)`,
          border: `1px solid ${color.primaryBorder}`,
          boxShadow: shadow.glow,
        }}>
          <div style={{ textAlign: 'center' }}>
            <IconBadge><Gift size={26} /></IconBadge>
            <Title style={{ marginTop: space[5] }}>Here&apos;s your reward</Title>
            <Subtitle style={{ marginTop: space[2], marginBottom: space[6], ...text.small }}>
              Thank you for reviewing {coupon.businessName}
            </Subtitle>

            {/* Discount hero */}
            <div style={{ background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.lg, padding: `${space[6]} ${space[4]}`, marginBottom: space[4] }}>
              <div className="tnum" style={{ fontSize: '52px', fontWeight: 700, color: color.primary, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {coupon.discountPct}% OFF
              </div>
              <p style={{ ...text.small, color: color.textMuted, margin: `${space[2]} 0 0` }}>your next visit</p>
            </div>

            {/* Code */}
            <div style={{ marginBottom: space[4] }}>
              <p style={{ ...text.tiny, color: color.textGhost, textTransform: 'uppercase', letterSpacing: '0.08em', margin: `0 0 ${space[2]}` }}>Coupon code</p>
              <div className="tnum" style={{
                fontFamily: 'ui-monospace, monospace', fontSize: '26px', fontWeight: 700, color: color.text,
                letterSpacing: '0.18em', background: color.surfaceRaised, border: `1px dashed ${color.borderStrong}`,
                borderRadius: radius.md, padding: `${space[3]} ${space[4]}`,
              }}>
                {coupon.code}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space[2], color: color.textMuted, ...text.small, marginBottom: space[1] }}>
              <Check size={16} color={color.primary} /> Show this screen to staff before billing
            </div>
            {expiry && <p style={{ ...text.tiny, color: color.textGhost, fontWeight: 400, margin: 0 }}>Valid until {expiry}</p>}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: space[2], textAlign: 'left', background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.md, padding: space[3], marginTop: space[5] }}>
              <Phone size={16} color={color.textMuted} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ ...text.tiny, fontWeight: 400, color: color.textMuted }}>
                We&apos;ve sent your coupon link to WhatsApp — save it to use later.
              </span>
            </div>
          </div>
        </Card>
      </CenteredPage>
    )
  }

  return null
}
