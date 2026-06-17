'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { color, radius, space, text, shadow, Button, Input } from '@/components/ui'
import { Ticket, Lock, Copy, Check, LogOut, Download, Refresh, Gift, Sparkles, Store, Star, Calculator } from '@/components/icons'

interface Submission {
  id: string
  customer_name: string
  customer_phone: string
  created_at: string
  coupon_code: string | null
}

interface Business {
  id: string
  name: string
  slug: string
  discount_pct: number
  google_review_url: string
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AdminDashboard({ businessSlug }: { businessSlug: string }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const sessionRef = useRef<Session | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')

  const [redeemCode, setRedeemCode] = useState('')
  const [redeemResult, setRedeemResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  const [pin, setPin] = useState('')
  const [pinSaved, setPinSaved] = useState(false)
  const [pinError, setPinError] = useState('')
  const [savingPin, setSavingPin] = useState(false)

  const [copied, setCopied] = useState(false)
  const [businessError, setBusinessError] = useState('')

  const [discountInput, setDiscountInput] = useState('')
  const [savingDiscount, setSavingDiscount] = useState(false)
  const [discountSaved, setDiscountSaved] = useState(false)
  const [discountError, setDiscountError] = useState('')

  // Review link edit
  const [reviewLinkInput, setReviewLinkInput] = useState('')
  const [savingLink, setSavingLink] = useState(false)
  const [linkSaved, setLinkSaved] = useState(false)
  const [linkError, setLinkError] = useState('')

  // Bill calculator
  const [billAmount, setBillAmount] = useState('')
  const [calcDiscount, setCalcDiscount] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      sessionRef.current = session
      setSession(session)
      setAuthChecked(true)
    })
  }, [router])

  useEffect(() => { if (session) sessionRef.current = session }, [session])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      QRCode.toDataURL(`${window.location.origin}/r/${businessSlug}`, {
        width: 320, margin: 1, color: { dark: '#0A0A0B', light: '#FFFFFF' },
      }).then(setQrDataUrl)
    }
  }, [businessSlug])

  useEffect(() => {
    if (!authChecked || !session) return
    fetchBusiness()
  }, [authChecked, session])

  useEffect(() => {
    if (!business) return
    fetchSubmissions()
    const interval = setInterval(() => fetchSubmissions(), 10000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchSubmissions() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id])

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` }
  }

  async function fetchBusiness() {
    try {
      const res = await fetch(`/api/business/${businessSlug}?t=${Date.now()}`, { headers: await authHeaders(), cache: 'no-store' })
      if (res.status === 401) { router.replace('/login'); return }
      const data = await res.json()
      if (!res.ok || !data?.id) {
        console.error('Business load failed:', res.status, data)
        setBusinessError(data?.error || 'Could not load this business.')
        return
      }
      setBusinessError('')
      setBusiness(data)
      setDiscountInput(String(data.discount_pct ?? ''))
      setReviewLinkInput(data.google_review_url ?? '')
      setCalcDiscount(prev => prev || String(data.discount_pct ?? ''))
    } catch (err) { console.error('Failed to fetch business:', err) }
  }

  async function handleSaveReviewLink() {
    const url = reviewLinkInput.trim()
    if (!url) { setLinkError('Enter a review link'); return }
    if (!url.includes('google.com') && !url.includes('g.page')) { setLinkError('Must be a Google Maps or review link'); return }
    setSavingLink(true); setLinkError('')
    try {
      const res = await fetch('/api/business/update-review-link', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ slug: businessSlug, reviewUrl: url }),
      })
      const data = await res.json()
      if (res.ok) {
        setBusiness(prev => prev ? { ...prev, google_review_url: url } : prev)
        setLinkSaved(true); setTimeout(() => setLinkSaved(false), 3000)
      } else { setLinkError(data.error || 'Failed') }
    } catch { setLinkError('Something went wrong') }
    setSavingLink(false)
  }

  async function handleSaveDiscount() {
    const pct = parseInt(discountInput)
    if (isNaN(pct) || pct < 1 || pct > 100) { setDiscountError('1–100 only'); return }
    setSavingDiscount(true); setDiscountError('')
    try {
      const res = await fetch('/api/business/update-discount', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ slug: businessSlug, discountPct: pct }),
      })
      const data = await res.json()
      if (res.ok) {
        setBusiness(prev => prev ? { ...prev, discount_pct: pct } : prev)
        setDiscountSaved(true); setTimeout(() => setDiscountSaved(false), 3000)
      } else { setDiscountError(data.error || 'Failed') }
    } catch { setDiscountError('Something went wrong') }
    setSavingDiscount(false)
  }

  async function fetchSubmissions() {
    try {
      const res = await fetch(`/api/submissions/${businessSlug}?t=${Date.now()}`, { headers: await authHeaders(), cache: 'no-store' })
      if (res.status === 401 || res.status === 403) return
      const data = await res.json()
      setSubmissions(data.submissions || [])
      setLastSync(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setLoading(false)
    } catch (err) { console.error('Failed to fetch submissions:', err); setLoading(false) }
  }

  async function handleRedeem(overrideCode?: string) {
    const code = (overrideCode ?? redeemCode).trim().toUpperCase()
    if (!code) return
    setRedeeming(true); setRedeemResult(null)
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ code, pin, adminOverride: true, businessId: business?.id }),
      })
      const data = await res.json()
      if (res.ok) { setRedeemResult({ success: true, message: `${data.discountPct}% off applied for ${data.businessName}` }); setRedeemCode('') }
      else { setRedeemResult({ error: data.error }) }
    } catch { setRedeemResult({ error: 'Something went wrong' }) }
    setRedeeming(false)
  }

  async function handleSavePin() {
    if (!/^\d{4}$/.test(pin)) { setPinError('Must be exactly 4 digits'); return }
    setSavingPin(true); setPinError('')
    try {
      const res = await fetch('/api/business/set-pin', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ pin, slug: businessSlug }),
      })
      if (res.ok) { setPinSaved(true); setTimeout(() => setPinSaved(false), 3000) }
      else { const d = await res.json(); setPinError(d.error || 'Failed to save') }
    } catch { setPinError('Something went wrong') }
    setSavingPin(false)
  }

  const reviewUrl = typeof window !== 'undefined' ? `${window.location.origin}/r/${businessSlug}` : ''

  function copyReviewLink() {
    navigator.clipboard.writeText(reviewUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (!authChecked) {
    return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.textFaint, ...text.small }}>Loading…</div>
  }

  const couponsIssued = submissions.filter(s => s.coupon_code).length

  const cardBase: React.CSSProperties = {
    background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.lg, padding: space[5],
  }

  // Bill calculator math
  const billNum = parseFloat(billAmount) || 0
  const discNum = parseFloat(calcDiscount) || 0
  const savedAmount = Math.round(billNum * discNum / 100)
  const finalBill = Math.round(billNum - savedAmount)
  const fmtRs = (n: number) => 'Rs ' + n.toLocaleString('en-PK')
  const showBillResult = billNum > 0 && discNum > 0

  return (
    <div style={{ minHeight: '100dvh', background: color.bg, padding: `${space[6]} ${space[4]}` }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space[6], flexWrap: 'wrap', gap: space[3] }}>
          <div style={{ display: 'flex', gap: space[3], alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: radius.md, background: color.primarySoft, border: `1px solid ${color.primaryBorder}`, color: color.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Store size={22} />
            </div>
            <div>
              <h1 style={{ ...text.h2, color: color.text, margin: 0 }}>{business?.name || businessSlug}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: space[2], flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ ...text.tiny, fontWeight: 400, color: color.textGhost }}>{reviewUrl.replace(/^https?:\/\//, '')}</span>
                <button onClick={copyReviewLink}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: copied ? color.primary : color.textMuted, ...text.tiny, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>
          </div>
          <Button variant="secondary" fullWidth={false} onClick={handleSignOut} style={{ padding: '9px 14px', fontSize: '13px' }}>
            <LogOut size={15} /> Sign out
          </Button>
        </header>

        {businessError && (
          <div style={{ background: color.dangerSoft, border: `1px solid ${color.danger}`, borderRadius: radius.md, padding: space[4], marginBottom: space[5], display: 'flex', alignItems: 'center', gap: space[2] }}>
            <span style={{ ...text.small, color: color.danger }}>{businessError} Try signing out and back in, or check you&apos;re logged into the right account.</span>
          </div>
        )}

        {/* Redeem panel — primary action */}
        <div style={{
          background: `linear-gradient(135deg, rgba(52,211,153,0.07), ${color.surface} 55%)`,
          border: `1px solid ${color.primaryBorder}`, borderRadius: radius.lg, padding: space[5], marginBottom: space[5],
          boxShadow: shadow.md,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: space[2], marginBottom: space[1] }}>
            <Ticket size={18} color={color.primary} />
            <h2 style={{ ...text.h3, color: color.text, margin: 0 }}>Redeem a coupon</h2>
          </div>
          <p style={{ ...text.small, color: color.textMuted, margin: `0 0 ${space[4]}` }}>
            Customer tells you their code — enter it to apply the discount and mark it used.
          </p>
          <div style={{ display: 'flex', gap: space[3], flexWrap: 'wrap' }}>
            <Input
              placeholder="RB-XXXX" value={redeemCode} maxLength={7}
              onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setRedeemResult(null) }}
              onKeyDown={e => e.key === 'Enter' && handleRedeem()}
              style={{ flex: 1, minWidth: '140px', fontFamily: 'ui-monospace, monospace', fontSize: '18px', letterSpacing: '0.15em', fontWeight: 600 }}
            />
            <Button fullWidth={false} onClick={() => handleRedeem()} loading={redeeming} disabled={!redeemCode.trim()} style={{ whiteSpace: 'nowrap' }}>
              Apply & mark used
            </Button>
          </div>
          {redeemResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: space[2], marginTop: space[3], ...text.small, color: redeemResult.success ? color.primary : color.danger }}>
              {redeemResult.success ? <Check size={16} /> : null}
              {redeemResult.success ? redeemResult.message : redeemResult.error}
            </div>
          )}
        </div>

        {/* Bill calculator */}
        <div style={{ ...cardBase, marginBottom: space[5] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: space[2], marginBottom: space[1] }}>
            <Calculator size={18} color={color.primary} />
            <h2 style={{ ...text.h3, color: color.text, margin: 0 }}>Bill calculator</h2>
          </div>
          <p style={{ ...text.small, color: color.textMuted, margin: `0 0 ${space[4]}` }}>
            Enter the bill and the discount — we&apos;ll show the new total to charge.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: space[3], alignItems: 'end' }}>
            <div>
              <label style={{ ...text.label, color: color.textMuted, display: 'block', marginBottom: space[2] }}>Total bill (Rs)</label>
              <Input type="number" inputMode="numeric" min="0" placeholder="0" value={billAmount}
                onChange={e => setBillAmount(e.target.value)}
                style={{ fontSize: '22px', fontWeight: 700 }} />
            </div>
            <div>
              <label style={{ ...text.label, color: color.textMuted, display: 'block', marginBottom: space[2] }}>Discount %</label>
              <Input type="number" inputMode="numeric" min="0" max="100" value={calcDiscount}
                onChange={e => setCalcDiscount(e.target.value)}
                style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center' }} />
            </div>
          </div>

          {/* Result */}
          <div style={{
            marginTop: space[4],
            background: showBillResult ? `linear-gradient(135deg, rgba(52,211,153,0.10), ${color.surfaceRaised} 60%)` : color.surfaceRaised,
            border: `1px solid ${showBillResult ? color.primaryBorder : color.border}`,
            borderRadius: radius.md, padding: space[5], textAlign: 'center',
          }}>
            <p style={{ ...text.tiny, fontWeight: 500, color: color.textMuted, margin: `0 0 ${space[1]}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              New bill to charge
            </p>
            <div className="tnum" style={{ fontSize: '40px', fontWeight: 800, color: showBillResult ? color.primary : color.textGhost, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {showBillResult ? fmtRs(finalBill) : 'Rs 0'}
            </div>
            {showBillResult && (
              <p className="tnum" style={{ ...text.small, color: color.textMuted, margin: `${space[2]} 0 0` }}>
                Customer saves {fmtRs(savedAmount)} ({discNum}% off {fmtRs(Math.round(billNum))})
              </p>
            )}
          </div>
        </div>

        {/* Grid: QR · stats+discount · PIN */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: space[4], marginBottom: space[7] }}>

          {/* QR */}
          <div style={{ ...cardBase, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {qrDataUrl && (
              <div style={{ background: '#fff', padding: space[3], borderRadius: radius.md, marginBottom: space[3] }}>
                <img src={qrDataUrl} alt="QR code for your review page" style={{ width: '150px', height: '150px', display: 'block' }} />
              </div>
            )}
            <a href={qrDataUrl} download={`${businessSlug}-qr.png`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: space[2], padding: '9px 18px', borderRadius: radius.md, background: color.surfaceRaised, border: `1px solid ${color.border}`, color: color.text, ...text.small, fontWeight: 600, textDecoration: 'none' }}>
              <Download size={15} /> Download QR
            </a>
            <p style={{ ...text.tiny, fontWeight: 400, color: color.textGhost, margin: `${space[2]} 0 0` }}>Print and place on tables</p>
          </div>

          {/* Stats + discount */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
            <div style={{ display: 'flex', gap: space[3] }}>
              <StatTile icon={<Sparkles size={16} />} label="Submissions" value={submissions.length} />
              <StatTile icon={<Gift size={16} />} label="Coupons" value={couponsIssued} />
            </div>
            <div style={cardBase}>
              <p style={{ ...text.tiny, fontWeight: 400, color: color.textMuted, margin: `0 0 ${space[2]}` }}>Discount offered</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
                <Input type="number" min="1" max="100" value={discountInput}
                  onChange={e => { setDiscountInput(e.target.value); setDiscountError(''); setDiscountSaved(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveDiscount()}
                  style={{ width: '72px', fontSize: '18px', fontWeight: 700, padding: '8px 10px' }} />
                <span style={{ ...text.h2, color: color.text }}>%</span>
                <div style={{ marginLeft: 'auto' }}>
                  <Button fullWidth={false} variant={discountSaved ? 'secondary' : 'primary'} onClick={handleSaveDiscount}
                    loading={savingDiscount} disabled={discountInput === String(business?.discount_pct ?? '')}
                    style={{ padding: '8px 14px', fontSize: '13px' }}>
                    {discountSaved ? <><Check size={14} /> Saved</> : 'Save'}
                  </Button>
                </div>
              </div>
              {discountError && <p style={{ ...text.tiny, color: color.danger, margin: `${space[2]} 0 0` }}>{discountError}</p>}
            </div>
          </div>

          {/* PIN setup */}
          <div style={cardBase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space[2], marginBottom: space[1] }}>
              <Lock size={16} color={color.textMuted} />
              <h3 style={{ ...text.h3, color: color.text, margin: 0 }}>Staff PIN</h3>
            </div>
            <p style={{ ...text.tiny, fontWeight: 400, color: color.textGhost, margin: `0 0 ${space[4]}`, lineHeight: 1.5 }}>
              Staff enter this on the customer&apos;s phone to redeem coupons.
            </p>
            <Input type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); setPinSaved(false) }}
              style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '0.4em', fontWeight: 700, marginBottom: space[2] }} />
            {pinError && <p style={{ ...text.tiny, color: color.danger, margin: `0 0 ${space[2]}` }}>{pinError}</p>}
            <Button variant={pinSaved ? 'secondary' : 'primary'} onClick={handleSavePin} loading={savingPin} disabled={pin.length !== 4}
              style={{ padding: '10px', fontSize: '13px' }}>
              {pinSaved ? <><Check size={14} /> PIN saved</> : 'Save PIN'}
            </Button>
          </div>
        </div>

        {/* Google review link editor */}
        <div style={{ ...cardBase, marginBottom: space[7] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: space[2], marginBottom: space[1] }}>
            <Star size={16} color={color.textMuted} />
            <h3 style={{ ...text.h3, color: color.text, margin: 0 }}>Google review link</h3>
          </div>
          <p style={{ ...text.tiny, fontWeight: 400, color: color.textGhost, margin: `0 0 ${space[3]}`, lineHeight: 1.5 }}>
            Where customers are sent to leave their review. Update it here if it was wrong.
          </p>

          {business?.google_review_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: space[2], background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.sm, padding: `${space[2]} ${space[3]}`, marginBottom: space[3] }}>
              <span style={{ ...text.tiny, fontWeight: 500, color: color.textMuted, flexShrink: 0 }}>Current:</span>
              <a href={business.google_review_url} target="_blank" rel="noreferrer"
                style={{ ...text.tiny, fontWeight: 400, color: color.primary, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {business.google_review_url}
              </a>
            </div>
          )}

          <div style={{ display: 'flex', gap: space[3], flexWrap: 'wrap' }}>
            <Input
              type="url" placeholder="https://search.google.com/local/writereview?placeid=…" value={reviewLinkInput}
              onChange={e => { setReviewLinkInput(e.target.value); setLinkError(''); setLinkSaved(false) }}
              onKeyDown={e => e.key === 'Enter' && handleSaveReviewLink()}
              style={{ flex: 1, minWidth: '200px', fontSize: '14px' }}
            />
            <Button fullWidth={false} variant={linkSaved ? 'secondary' : 'primary'} onClick={handleSaveReviewLink}
              loading={savingLink} disabled={reviewLinkInput.trim() === (business?.google_review_url ?? '')}
              style={{ whiteSpace: 'nowrap' }}>
              {linkSaved ? <><Check size={14} /> Saved</> : 'Save link'}
            </Button>
          </div>
          {linkError && <p style={{ ...text.tiny, color: color.danger, margin: `${space[2]} 0 0` }}>{linkError}</p>}
        </div>

        {/* Submissions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[4], flexWrap: 'wrap', gap: space[2] }}>
          <h2 style={{ ...text.h2, color: color.text, margin: 0 }}>
            Review submissions <span style={{ color: color.textGhost, fontWeight: 500 }}>({submissions.length})</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
            {lastSync && <span className="tnum" style={{ ...text.tiny, fontWeight: 400, color: color.textGhost }}>Synced {lastSync}</span>}
            <button onClick={() => fetchSubmissions()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: color.surface, border: `1px solid ${color.border}`, color: color.textMuted, padding: '7px 12px', borderRadius: radius.sm, ...text.tiny, fontWeight: 500, cursor: 'pointer' }}>
              <Refresh size={13} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ ...text.small, color: color.textFaint, textAlign: 'center', padding: `${space[8]} 0` }}>Loading…</p>
        ) : submissions.length === 0 ? (
          <div style={{ ...cardBase, padding: `${space[9]} ${space[6]}`, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', marginBottom: space[3], color: color.textFaint }}><Sparkles size={28} /></div>
            <p style={{ ...text.small, color: color.textMuted, margin: 0 }}>No submissions yet. Share your QR code to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
            {submissions.map(sub => (
              <div key={sub.id} style={{
                background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.md,
                padding: `${space[4]} ${space[5]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: space[3], flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <p style={{ ...text.h3, color: color.text, margin: '0 0 2px' }}>{sub.customer_name}</p>
                  <p className="tnum" style={{ ...text.tiny, fontWeight: 400, color: color.textFaint, margin: 0 }}>
                    {sub.customer_phone} · {timeAgo(sub.created_at)}
                  </p>
                </div>
                {sub.coupon_code ? (
                  <span className="tnum" style={{ fontFamily: 'ui-monospace, monospace', ...text.small, fontWeight: 600, color: color.textMuted, letterSpacing: '0.12em', background: color.surfaceRaised, border: `1px solid ${color.border}`, borderRadius: radius.sm, padding: '6px 12px' }}>
                    {sub.coupon_code}
                  </span>
                ) : (
                  <span style={{ ...text.tiny, color: color.textGhost }}>No coupon</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={{ flex: 1, background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.lg, padding: space[4] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: color.textMuted, marginBottom: space[2] }}>
        {icon}<span style={{ ...text.tiny, fontWeight: 400 }}>{label}</span>
      </div>
      <p className="tnum" style={{ fontSize: '26px', fontWeight: 700, color: color.text, margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}
