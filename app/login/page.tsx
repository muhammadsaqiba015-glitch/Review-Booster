'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { usernameToEmail } from '@/lib/username'
import { CenteredPage, Card, IconBadge, Title, Subtitle, Button, Field, Input, color, space, text } from '@/components/ui'
import { Lock, ArrowRight } from '@/components/icons'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!username.trim()) { setError('Enter your username'); return }
    if (!password) { setError('Enter your password'); return }
    setLoading(true); setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username), password,
    })
    if (authError || !data.session) { setError('Incorrect username or password'); setLoading(false); return }

    try {
      const res = await fetch('/api/my-business', { headers: { 'Authorization': `Bearer ${data.session.access_token}` } })
      const result = await res.json()
      router.replace(res.ok && result.slug ? `/admin/${result.slug}` : '/onboard')
    } catch {
      router.replace('/onboard')
    }
  }

  return (
    <CenteredPage>
      <Card className="rb-fade-up">
        <div style={{ textAlign: 'center', marginBottom: space[7] }}>
          <IconBadge><Lock size={24} /></IconBadge>
          <Title style={{ marginTop: space[5] }}>Owner login</Title>
          <Subtitle style={{ marginTop: space[2], ...text.small }}>Log in with your username and password.</Subtitle>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
          <Field label="Username">
            <Input autoCapitalize="none" placeholder="alis_karahi" value={username}
              onChange={e => { setUsername(e.target.value); setError('') }} />
          </Field>
          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ paddingRight: '60px' }} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: color.primary, ...text.tiny, fontWeight: 600, cursor: 'pointer', padding: space[1] }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>
        </div>

        {error && <p style={{ ...text.small, color: color.danger, margin: `${space[4]} 0 0`, textAlign: 'center' }}>{error}</p>}

        <div style={{ marginTop: space[6] }}>
          <Button onClick={handleLogin} loading={loading}>
            {loading ? 'Logging in…' : <>Log in <ArrowRight size={18} /></>}
          </Button>
        </div>
        <p style={{ ...text.small, color: color.textFaint, marginTop: space[5], textAlign: 'center' }}>
          New business? <a href="/onboard" style={{ color: color.primary, textDecoration: 'none', fontWeight: 500 }}>Get started</a>
        </p>
      </Card>
    </CenteredPage>
  )
}
