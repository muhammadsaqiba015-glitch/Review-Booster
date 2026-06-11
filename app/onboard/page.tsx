'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Step = 'details' | 'email' | 'sent'

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
  maxWidth: '420px',
  width: '100%',
  border: '1px solid #2a2a2a',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: '12px',
  border: '1px solid #333',
  background: '#0f0f0f',
  color: '#fff',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: '13px',
  display: 'block',
  marginBottom: '8px',
}

export default function OnboardPage() {
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [businessName, setBusinessName] = useState('')
  const [reviewUrl, setReviewUrl] = useState('')
  const [discountPct, setDiscountPct] = useState('15')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  function validateDetails() {
    if (!businessName.trim() || businessName.trim().length < 2) return 'Enter your business name'
    if (!reviewUrl.trim()) return 'Paste your Google review link'
    if (!reviewUrl.includes('google.com') && !reviewUrl.includes('g.page')) return 'Must be a Google Maps or review link'
    const pct = parseInt(discountPct)
    if (isNaN(pct) || pct < 1 || pct > 100) return 'Discount must be between 1–100%'
    if (!whatsapp || whatsapp.replace(/\D/g, '').length < 10) return 'Enter a valid WhatsApp number'
    return null
  }

  function handleDetailsNext() {
    const err = validateDetails()
    if (err) { setError(err); return }
    setError('')
    setStep('email')
  }

  async function handleSendMagicLink() {
    if (!email || !email.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true)
    setError('')

    // Store business details in localStorage so the callback page can create the business
    localStorage.setItem('pending_business', JSON.stringify({
      name: businessName.trim(),
      reviewUrl: reviewUrl.trim(),
      discountPct: parseInt(discountPct),
      phone: whatsapp.trim(),
    }))

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/onboard/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setStep('sent')
    setLoading(false)
  }

  const primaryBtn = (disabled = false): React.CSSProperties => ({
    width: '100%',
    padding: '15px',
    borderRadius: '12px',
    border: 'none',
    background: disabled ? '#333' : '#4ade80',
    color: disabled ? '#888' : '#0f0f0f',
    fontSize: '15px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: '8px',
  })

  if (step === 'details') {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏪</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
            Add your business
          </h1>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 32px' }}>
            Set up your review campaign in 2 minutes
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Business name</label>
              <input
                type="text"
                placeholder="Ali's Karahi House"
                value={businessName}
                onChange={e => { setBusinessName(e.target.value); setError('') }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Google review link</label>
              <input
                type="url"
                placeholder="https://search.google.com/local/writereview?placeid=..."
                value={reviewUrl}
                onChange={e => { setReviewUrl(e.target.value); setError('') }}
                style={inputStyle}
              />
              <p style={{ color: '#555', fontSize: '12px', marginTop: '6px' }}>
                Google Maps → your business → Share → Copy review link
              </p>
            </div>

            <div>
              <label style={labelStyle}>Discount % to offer customers</label>
              <input
                type="number"
                placeholder="15"
                min="1"
                max="100"
                value={discountPct}
                onChange={e => { setDiscountPct(e.target.value); setError('') }}
                style={{ ...inputStyle, width: '120px' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Your WhatsApp number</label>
              <input
                type="tel"
                placeholder="03XX-XXXXXXX"
                value={whatsapp}
                onChange={e => { setWhatsapp(e.target.value); setError('') }}
                style={inputStyle}
              />
              <p style={{ color: '#555', fontSize: '12px', marginTop: '6px' }}>
                For notifications when coupons are redeemed
              </p>
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', marginBottom: '0' }}>{error}</p>}

          <button onClick={handleDetailsNext} style={primaryBtn()}>
            Continue →
          </button>
        </div>
      </div>
    )
  }

  if (step === 'email') {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
            Almost there
          </h1>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 32px' }}>
            Enter your email — we'll send a magic link to finish setup. No password needed.
          </p>

          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Your email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSendMagicLink()}
              style={inputStyle}
            />
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '12px', marginBottom: '0' }}>{error}</p>}

          <button onClick={handleSendMagicLink} disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'Sending...' : 'Send magic link →'}
          </button>

          <button
            onClick={() => { setStep('details'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: '13px', cursor: 'pointer', marginTop: '16px', width: '100%' }}
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // sent
  return (
    <div style={cardStyle}>
      <div style={boxStyle}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📬</div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>
          Check your email
        </h1>
        <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px' }}>
          We sent a magic link to <span style={{ color: '#fff' }}>{email}</span>.
          Click it to finish setting up your business — no password needed.
        </p>
        <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
          Didn't get it? Check your spam folder or{' '}
          <span
            style={{ color: '#4ade80', cursor: 'pointer' }}
            onClick={() => { setStep('email'); setError('') }}
          >
            resend
          </span>
          .
        </p>
      </div>
    </div>
  )
}
