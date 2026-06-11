'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !email.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true)
    setError('')

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

    setSent(true)
    setLoading(false)
  }

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

  if (sent) {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📬</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>
            Check your email
          </h1>
          <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', margin: '0 0 16px' }}>
            We sent a magic link to <span style={{ color: '#fff' }}>{email}</span>.
            Click it to access your dashboard.
          </p>
          <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
            Didn't get it?{' '}
            <span
              style={{ color: '#4ade80', cursor: 'pointer' }}
              onClick={() => setSent(false)}
            >
              Resend
            </span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={boxStyle}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔑</div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>
          Owner login
        </h1>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 32px' }}>
          Enter your email and we'll send a magic link to your dashboard.
        </p>

        <div style={{ marginBottom: '8px', textAlign: 'left' }}>
          <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '12px',
              border: '1px solid #333',
              background: '#0f0f0f',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '12px', textAlign: 'left' }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            border: 'none',
            background: loading ? '#333' : '#4ade80',
            color: loading ? '#888' : '#0f0f0f',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '8px',
          }}
        >
          {loading ? 'Sending...' : 'Send magic link →'}
        </button>

        <p style={{ color: '#555', fontSize: '13px', marginTop: '24px' }}>
          New business?{' '}
          <a href="/onboard" style={{ color: '#4ade80', textDecoration: 'none' }}>
            Get started here
          </a>
        </p>
      </div>
    </div>
  )
}
