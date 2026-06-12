'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type State = 'loading' | 'creating' | 'error'

export default function OnboardCallback() {
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let handled = false

    async function proceed(session: import('@supabase/supabase-js').Session) {
      if (handled) return
      handled = true
      setState('creating')

      const pending = localStorage.getItem('pending_business')

      if (pending) {
        // New business owner — create the business
        try {
          const businessData = JSON.parse(pending)
          const res = await fetch('/api/onboard/create-business', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(businessData),
          })
          const data = await res.json()

          if (!res.ok) {
            setErrorMsg(data.error || 'Failed to create business')
            setState('error')
            return
          }

          localStorage.removeItem('pending_business')
          router.replace(`/admin/${data.slug}`)
        } catch {
          setErrorMsg('Something went wrong. Please try again.')
          setState('error')
        }
      } else {
        // Returning owner — find their business via the API (service role, reliable)
        try {
          const res = await fetch('/api/my-business', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          })
          const data = await res.json()
          if (res.ok && data.slug) {
            router.replace(`/admin/${data.slug}`)
          } else {
            router.replace('/onboard')
          }
        } catch {
          router.replace('/onboard')
        }
      }
    }

    // 1) Handle the case where the session is already established (token in URL parsed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) proceed(session)
    })

    // 2) Also listen for the sign-in event as a backup
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) proceed(session)
    })

    // 3) If nothing happened within 5s, the magic link was likely stale
    const timeout = setTimeout(() => {
      if (!handled) {
        setErrorMsg('This sign-in link has expired or was already used. Please request a new one.')
        setState('error')
      }
    }, 5000)

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [router])

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
    padding: '48px 32px',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid #2a2a2a',
  }

  if (state === 'error') {
    return (
      <div style={cardStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: '0 0 12px' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>{errorMsg}</p>
          <button
            onClick={() => router.replace('/login')}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: '#4ade80',
              color: '#0f0f0f',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Request a new link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={boxStyle}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {state === 'creating' ? '🏗️' : '⏳'}
        </div>
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: '0 0 12px' }}>
          {state === 'creating' ? 'Setting up your business...' : 'Signing you in...'}
        </h1>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
          This only takes a second.
        </p>
      </div>
    </div>
  )
}
