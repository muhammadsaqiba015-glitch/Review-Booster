'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { usernameToEmail, isValidUsername } from '@/lib/username'

type Step = 'details' | 'account'

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
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Business fields
  const [businessName, setBusinessName] = useState('')
  const [reviewUrl, setReviewUrl] = useState('')
  const [discountPct, setDiscountPct] = useState('15')
  const [whatsapp, setWhatsapp] = useState('')

  // Account fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

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
    setStep('account')
  }

  async function handleCreateAccount() {
    if (!isValidUsername(username)) { setError('Username must be 3–30 letters, numbers, or underscores'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')

    // 1) Create the auth account (instant — email confirmation is disabled in Supabase)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
    })

    if (signUpError) {
      const msg = signUpError.message.toLowerCase().includes('already')
        ? 'That username is taken. Try another.'
        : signUpError.message
      setError(msg)
      setLoading(false)
      return
    }

    // Make sure we have a session (sign in if signUp didn't return one)
    let session = signUpData.session
    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      })
      if (signInError || !signInData.session) {
        setError('Account created but sign-in failed. Try logging in.')
        setLoading(false)
        return
      }
      session = signInData.session
    }

    // 2) Create the business in the same session
    try {
      const res = await fetch('/api/onboard/create-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: businessName.trim(),
          reviewUrl: reviewUrl.trim(),
          discountPct: parseInt(discountPct),
          phone: whatsapp.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.slug) {
        setError(data.error || 'Failed to create business')
        setLoading(false)
        return
      }
      router.replace(`/admin/${data.slug}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
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

          <p style={{ color: '#555', fontSize: '13px', marginTop: '20px', textAlign: 'center' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#4ade80', textDecoration: 'none' }}>Log in</a>
          </p>
        </div>
      </div>
    )
  }

  // account step
  return (
    <div style={cardStyle}>
      <div style={boxStyle}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔐</div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
          Create your login
        </h1>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 32px' }}>
          Pick a username and password. Use these to log in from any device.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              autoCapitalize="none"
              placeholder="alis_karahi"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
              style={inputStyle}
            />
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '16px', marginBottom: '0' }}>{error}</p>}

        <button onClick={handleCreateAccount} disabled={loading} style={primaryBtn(loading)}>
          {loading ? 'Creating your business...' : 'Create account & finish →'}
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
