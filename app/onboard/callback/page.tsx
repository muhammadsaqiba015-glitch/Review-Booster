'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CenteredPage, Card, IconBadge, Title, Subtitle, Button, Spinner, color, space, text } from '@/components/ui'
import { XCircle } from '@/components/icons'

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

      // localStorage details are a fast path; create-business also falls back to
      // the server-side pending record (keyed by email) for cross-device links,
      // and returns the existing business for returning owners (idempotent).
      let body = {}
      try {
        const pending = localStorage.getItem('pending_business')
        if (pending) body = JSON.parse(pending)
      } catch { /* ignore */ }

      try {
        const res = await fetch('/api/onboard/create-business', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        })
        const data = await res.json()

        if (res.ok && data.slug) {
          localStorage.removeItem('pending_business')
          router.replace(`/admin/${data.slug}`)
        } else {
          // Authenticated but no business and no pending details → start onboarding
          router.replace('/onboard')
        }
      } catch {
        setErrorMsg('Something went wrong. Please try again.')
        setState('error')
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

  if (state === 'error') {
    return (
      <CenteredPage>
        <Card style={{ textAlign: 'center' }}>
          <IconBadge tone="neutral"><XCircle size={26} color={color.danger} /></IconBadge>
          <Title style={{ marginTop: space[5] }}>Something went wrong</Title>
          <Subtitle style={{ marginTop: space[2], marginBottom: space[6], ...text.small }}>{errorMsg}</Subtitle>
          <Button onClick={() => router.replace('/login')}>Request a new link</Button>
        </Card>
      </CenteredPage>
    )
  }

  return (
    <CenteredPage>
      <Card style={{ textAlign: 'center' }}>
        <IconBadge><Spinner size={24} c={color.primary} /></IconBadge>
        <Title style={{ marginTop: space[5] }}>
          {state === 'creating' ? 'Setting up your business…' : 'Signing you in…'}
        </Title>
        <Subtitle style={{ marginTop: space[2], ...text.small }}>This only takes a second.</Subtitle>
      </Card>
    </CenteredPage>
  )
}
