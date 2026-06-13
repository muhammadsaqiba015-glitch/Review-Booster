'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { usernameToEmail } from '@/lib/username'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!username.trim()) { setError('Enter your username'); return }
    if (!password) { setError('Enter your password'); return }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })

    if (authError || !data.session) {
      setError('Incorrect username or password')
      setLoading(false)
      return
    }

    // Find this owner's business
    try {
      const res = await fetch('/api/my-business', {
        headers: { 'Authorization': `Bearer ${data.session.access_token}` },
      })
      const result = await res.json()
      if (res.ok && result.slug) {
        router.replace(`/admin/${result.slug}`)
      } else {
        router.replace('/onboard')
      }
    } catch {
      router.replace('/onboard')
    }
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

  return (
    <div style={cardStyle}>
      <div style={boxStyle}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔑</div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>
          Owner login
        </h1>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 32px' }}>
          Log in with your username and password.
        </p>

        <div style={{ marginBottom: '14px', textAlign: 'left' }}>
          <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            Username
          </label>
          <input
            type="text"
            autoCapitalize="none"
            placeholder="alis_karahi"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '8px', textAlign: 'left' }}>
          <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inputStyle}
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
            marginTop: '12px',
          }}
        >
          {loading ? 'Logging in...' : 'Log in →'}
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
