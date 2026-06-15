'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { usernameToEmail, isValidUsername } from '@/lib/username'
import { CenteredPage, Card, IconBadge, Title, Subtitle, Button, Field, Input, color, radius, space, text } from '@/components/ui'
import { Store, Lock, ArrowRight } from '@/components/icons'

type Step = 'details' | 'account'

export default function OnboardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [reviewUrl, setReviewUrl] = useState('')
  const [discountPct, setDiscountPct] = useState('15')
  const [whatsapp, setWhatsapp] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
    setError(''); setStep('account')
  }

  async function handleCreateAccount() {
    if (!isValidUsername(username)) { setError('Username must be 3–30 letters, numbers, or underscores'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(username), password,
    })
    if (signUpError) {
      setError(signUpError.message.toLowerCase().includes('already') ? 'That username is taken. Try another.' : signUpError.message)
      setLoading(false); return
    }

    let session = signUpData.session
    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username), password,
      })
      if (signInError || !signInData.session) { setError('Account created but sign-in failed. Try logging in.'); setLoading(false); return }
      session = signInData.session
    }

    try {
      const res = await fetch('/api/onboard/create-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ name: businessName.trim(), reviewUrl: reviewUrl.trim(), discountPct: parseInt(discountPct), phone: whatsapp.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.slug) { setError(data.error || 'Failed to create business'); setLoading(false); return }
      router.replace(`/admin/${data.slug}`)
    } catch {
      setError('Something went wrong. Please try again.'); setLoading(false)
    }
  }

  if (step === 'details') {
    return (
      <CenteredPage>
        <Card className="rb-fade-up" style={{ maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: space[7] }}>
            <IconBadge><Store size={26} /></IconBadge>
            <Title style={{ marginTop: space[5] }}>Add your business</Title>
            <Subtitle style={{ marginTop: space[2], ...text.small }}>Set up your review campaign in 2 minutes</Subtitle>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
            <Field label="Business name">
              <Input placeholder="Ali's Karahi House" value={businessName}
                onChange={e => { setBusinessName(e.target.value); setError('') }} />
            </Field>
            <Field label="Google review link" hint="Google Maps → your business → Share → Copy review link">
              <Input type="url" placeholder="https://search.google.com/local/writereview?placeid=…" value={reviewUrl}
                onChange={e => { setReviewUrl(e.target.value); setError('') }} />
            </Field>
            <Field label="Discount % to offer">
              <Input type="number" min="1" max="100" value={discountPct} style={{ width: '120px' }}
                onChange={e => { setDiscountPct(e.target.value); setError('') }} />
            </Field>
            <Field label="Your WhatsApp number" hint="For notifications when coupons are redeemed">
              <Input type="tel" inputMode="tel" placeholder="03XX-XXXXXXX" value={whatsapp}
                onChange={e => { setWhatsapp(e.target.value); setError('') }} />
            </Field>
          </div>

          {error && <p style={{ ...text.small, color: color.danger, margin: `${space[4]} 0 0`, textAlign: 'center' }}>{error}</p>}

          <div style={{ marginTop: space[6] }}>
            <Button onClick={handleDetailsNext}>Continue <ArrowRight size={18} /></Button>
          </div>
          <p style={{ ...text.small, color: color.textFaint, marginTop: space[5], textAlign: 'center' }}>
            Already have an account? <a href="/login" style={{ color: color.primary, textDecoration: 'none', fontWeight: 500 }}>Log in</a>
          </p>
        </Card>
      </CenteredPage>
    )
  }

  return (
    <CenteredPage>
      <Card className="rb-fade-up" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: space[7] }}>
          <IconBadge><Lock size={24} /></IconBadge>
          <Title style={{ marginTop: space[5] }}>Create your login</Title>
          <Subtitle style={{ marginTop: space[2], ...text.small }}>Pick a username and password to log in from any device.</Subtitle>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
          <Field label="Username">
            <Input autoCapitalize="none" placeholder="alis_karahi" value={username}
              onChange={e => { setUsername(e.target.value); setError('') }} />
          </Field>
          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <Input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
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
          <Button onClick={handleCreateAccount} loading={loading}>
            {loading ? 'Creating your business…' : <>Create account & finish <ArrowRight size={18} /></>}
          </Button>
        </div>
        <div style={{ marginTop: space[3] }}>
          <Button variant="ghost" onClick={() => { setStep('details'); setError('') }}>← Back</Button>
        </div>
      </Card>
    </CenteredPage>
  )
}
