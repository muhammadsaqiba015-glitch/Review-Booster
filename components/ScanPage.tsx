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

  function inputStyle(hasError: boolean): React.CSSProperties {
    return {
      width: '100%',
      padding: '14px 16px',
      borderRadius: '12px',
      border: `1px solid ${hasError ? '#f87171' : '#333'}`,
      background: '#0f0f0f',
      color: '#fff',
      fontSize: '16px',
      outline: 'none',
      boxSizing: 'border-box',
    }
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

  function validateForm() {
    let valid = true
    if (!name || name.trim().length < 2) {
      setNameError('Please enter your name')
      valid = false
    } else {
      setNameError('')
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setPhoneError('Please enter a valid phone number')
      valid = false
    } else {
      setPhoneError('')
    }
    return valid
  }

  async function handleFormSubmit() {
    if (!validateForm()) return

    // Open review page immediately — must happen before any await or mobile browsers block it
    window.open(business.google_review_url, '_blank')

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
    setUploadError('')
  }

  async function handleClaimCoupon() {
    if (!screenshot) { setUploadError('Please upload a screenshot of your review'); return }
    setLoading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('submissionId', submissionId)
      formData.append('screenshot', screenshot)
      const res = await fetch('/api/submission/claim-coupon', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error || 'Something went wrong'); setLoading(false); return }
      setCoupon({
        code: data.couponCode,
        discountPct: data.discountPct,
        businessName: data.businessName,
        expiresAt: data.expiresAt,
      })
      setStep('coupon')
    } catch {
      setUploadError('Something went wrong. Please try again.')
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
              onChange={e => { setName(e.target.value); setNameError('') }}
              style={inputStyle(!!nameError)}
            />
            {nameError && <p style={{ color: '#f87171', fontSize: '12px', margin: '6px 0 0' }}>{nameError}</p>}
          </div>

          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Your WhatsApp number</label>
            <input
              type="tel"
              placeholder="03XX-XXXXXXX"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneError('') }}
              onKeyDown={e => e.key === 'Enter' && handleFormSubmit()}
              style={inputStyle(!!phoneError)}
            />
            {phoneError && <p style={{ color: '#f87171', fontSize: '12px', margin: '6px 0 0' }}>{phoneError}</p>}
            <p style={{ color: '#555', fontSize: '12px', margin: '6px 0 0' }}>
              Your coupon link will be sent here
            </p>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>}

          <button onClick={handleFormSubmit} disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'Submitting...' : 'Leave a Review →'}
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Reviewing
  if (step === 'reviewing') {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 12px' }}>
            Leave your review
          </h1>
          <p style={{ color: '#888', fontSize: '15px', margin: '0 0 24px', lineHeight: '1.6' }}>
            Write your review on Google, then come back here and upload a screenshot to claim your coupon.
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

          {/* Step-by-step instructions */}
          <div style={{ background: '#111', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ color: '#666', fontSize: '12px', margin: '0 0 10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How to get screenshot</p>
            {[
              'Go to Google Maps on your phone',
              'Find your review you just posted',
              'Take a screenshot showing your name + review',
              'Upload it below',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < 3 ? '8px' : '0', alignItems: 'flex-start' }}>
                <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700', minWidth: '18px' }}>{i + 1}.</span>
                <span style={{ color: '#888', fontSize: '13px', lineHeight: '1.4' }}>{step}</span>
              </div>
            ))}
          </div>

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
                padding: '28px 16px',
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
              <span style={{ fontSize: '28px' }}>🖼️</span>
              <span>Tap to select screenshot</span>
            </button>
          )}

          {uploadError && <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 16px' }}>{uploadError}</p>}

          <button onClick={handleClaimCoupon} disabled={loading || !screenshot} style={primaryBtn(loading || !screenshot)}>
            {loading ? 'Verifying...' : 'Get My Coupon →'}
          </button>
        </div>
      </div>
    )
  }

  // Step 4: Coupon
  if (step === 'coupon' && coupon) {
    const expiryDate = coupon.expiresAt
      ? new Date(coupon.expiresAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

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
          padding: '40px 32px',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>
            Here's your coupon!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: '0 0 20px' }}>
            Thank you for reviewing {coupon.businessName}
          </p>

          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ color: '#fff', fontSize: '48px', fontWeight: '800', margin: '0 0 4px', letterSpacing: '-1px' }}>
              {coupon.discountPct}% OFF
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>your next visit</p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px 20px', marginBottom: '16px', display: 'inline-block' }}>
            <span style={{ color: '#fff', fontSize: '26px', fontWeight: '700', letterSpacing: '4px', fontFamily: 'monospace' }}>
              {coupon.code}
            </span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>
            Show this screen to staff before your bill
          </p>
          {expiryDate && (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: '0 0 16px' }}>
              Valid until {expiryDate}
            </p>
          )}

          <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '12px 16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
              📱 Your coupon link has been sent to your WhatsApp. Save it to use later.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
