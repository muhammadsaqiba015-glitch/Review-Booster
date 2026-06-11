'use client'
import { useState, useRef } from 'react'

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

export default function ScanPage({ business }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [submissionId, setSubmissionId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [coupon, setCoupon] = useState<{ code: string; discountPct: number; businessName: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cardStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#0f0f0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui, sans-serif',
  }

  const boxStyle: React.CSSProperties = {
    background: '#1a1a1a',
    borderRadius: '24px',
    padding: '40px 32px',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid #2a2a2a',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const primaryBtn = (disabled = false): React.CSSProperties => ({
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: disabled ? '#333' : '#4ade80',
    color: disabled ? '#888' : '#0f0f0f',
    fontSize: '16px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
  })

  const ghostBtn: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #333',
    background: 'transparent',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
  }

  async function handleFormSubmit() {
    if (!name || name.trim().length < 2) { setError('Please enter your name'); return }
    if (!phone || phone.replace(/\D/g, '').length < 10) { setError('Please enter a valid phone number'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, customerName: name, customerPhone: phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      setSubmissionId(data.submissionId)
      window.open(business.google_review_url, '_blank')
      setStep('reviewing')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshot(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleClaimCoupon() {
    if (!screenshot) { setError('Please upload a screenshot of your review'); return }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('submissionId', submissionId)
      formData.append('screenshot', screenshot)
      const res = await fetch('/api/submission/claim-coupon', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      setCoupon({ code: data.couponCode, discountPct: data.discountPct, businessName: data.businessName })
      setStep('coupon')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Form
  if (step === 'form') {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 8px' }}>
            Review {business.name}
          </h1>
          <p style={{ color: '#888', fontSize: '15px', margin: '0 0 32px', lineHeight: '1.5' }}>
            Leave us a Google review and get{' '}
            <span style={{ color: '#4ade80', fontWeight: '600' }}>{business.discount_pct}% off</span>{' '}
            your next visit
          </p>

          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Your name</label>
            <input
              type="text"
              placeholder="Ali Hassan"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Your phone number</label>
            <input
              type="tel"
              placeholder="03XX-XXXXXXX"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleFormSubmit()}
              style={inputStyle}
            />
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>}

          <button onClick={handleFormSubmit} disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'Submitting...' : 'Leave a Review →'}
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Reviewing — customer on Google
  if (step === 'reviewing') {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 12px' }}>
            Leave your review
          </h1>
          <p style={{ color: '#888', fontSize: '15px', margin: '0 0 24px', lineHeight: '1.6' }}>
            Write your review on Google. Once posted, come back here and upload a screenshot to claim your coupon.
          </p>
          <button onClick={() => setStep('uploading')} style={primaryBtn()}>
            I've posted my review →
          </button>
          <div style={{ marginTop: '12px' }}>
            <button onClick={() => window.open(business.google_review_url, '_blank')} style={ghostBtn}>
              Reopen Google review →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Upload screenshot
  if (step === 'uploading') {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 8px' }}>
            Upload your screenshot
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px', lineHeight: '1.5' }}>
            Take a screenshot of your posted Google review and upload it below.
          </p>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

          {previewUrl ? (
            <div style={{ marginBottom: '20px' }}>
              <img
                src={previewUrl}
                alt="Review screenshot"
                style={{ width: '100%', borderRadius: '12px', border: '1px solid #333', maxHeight: '200px', objectFit: 'cover' }}
              />
              <button
                onClick={() => { setScreenshot(null); setPreviewUrl(null) }}
                style={{ ...ghostBtn, marginTop: '8px', padding: '8px 16px', width: 'auto' }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '32px 16px',
                borderRadius: '12px',
                border: '2px dashed #333',
                background: 'transparent',
                color: '#555',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '32px' }}>🖼️</span>
              <span>Tap to select screenshot</span>
            </button>
          )}

          {error && <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>}

          <button onClick={handleClaimCoupon} disabled={loading || !screenshot} style={primaryBtn(loading || !screenshot)}>
            {loading ? 'Verifying...' : 'Get My Coupon →'}
          </button>
        </div>
      </div>
    )
  }

  // Step 4: Coupon
  if (step === 'coupon' && coupon) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#16a34a',
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '700', margin: '0 0 8px' }}>
            Here's your coupon!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: '0 0 24px' }}>
            Thank you for reviewing {coupon.businessName}
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <p style={{ color: '#fff', fontSize: '52px', fontWeight: '800', margin: '0 0 4px', letterSpacing: '-1px' }}>
              {coupon.discountPct}% OFF
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>
              your next visit
            </p>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'inline-block',
          }}>
            <span style={{ color: '#fff', fontSize: '24px', fontWeight: '700', letterSpacing: '4px', fontFamily: 'monospace' }}>
              {coupon.code}
            </span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
            Show this screen to staff before your bill is made.{'\n'}Valid for 30 days.
          </p>
        </div>
      </div>
    )
  }

  return null
}
