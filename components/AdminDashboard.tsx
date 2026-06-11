'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface Submission {
  id: string
  customer_name: string
  customer_phone: string
  created_at: string
  coupon_generated: boolean
  coupon_code: string | null
  screenshot_url: string | null
  coupon_status: 'active' | 'redeemed' | 'expired' | null
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
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Redeem coupon (admin)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemResult, setRedeemResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  // PIN setup
  const [pin, setPin] = useState('')
  const [pinSaved, setPinSaved] = useState(false)
  const [pinError, setPinError] = useState('')
  const [savingPin, setSavingPin] = useState(false)

  // Review link copy
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      sessionRef.current = session
      setSession(session)
      setAuthChecked(true)
    })
  }, [router])

  useEffect(() => {
    if (session) sessionRef.current = session
  }, [session])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      QRCode.toDataURL(`${window.location.origin}/r/${businessSlug}`, { width: 240, margin: 2 })
        .then(setQrDataUrl)
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
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id])

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionRef.current!.access_token}`,
    }
  }

  async function fetchBusiness() {
    try {
      const res = await fetch(`/api/business/${businessSlug}`, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) { router.replace('/login'); return }
      const data = await res.json()
      setBusiness(data)
    } catch (err) {
      console.error('Failed to fetch business:', err)
    }
  }

  async function fetchSubmissions() {
    try {
      const res = await fetch(`/api/submissions/${businessSlug}`, { headers: authHeaders() })
      if (res.status === 401 || res.status === 403) return
      const data = await res.json()
      setSubmissions(data.submissions || [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
      setLoading(false)
    }
  }

  async function handleRedeem(overrideCode?: string) {
    const code = overrideCode ?? redeemCode
    if (!code.trim()) return
    setRedeeming(true)
    setRedeemResult(null)
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code: code.trim().toUpperCase(), pin, adminOverride: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setRedeemResult({ success: true, message: `✓ Redeemed — ${data.discountPct}% off applied for ${data.businessName}` })
        setRedeemCode('')
        fetchSubmissions()
      } else {
        setRedeemResult({ error: data.error })
      }
    } catch {
      setRedeemResult({ error: 'Something went wrong' })
    }
    setRedeeming(false)
  }

  async function handleSavePin() {
    if (!/^\d{4}$/.test(pin)) { setPinError('Must be exactly 4 digits'); return }
    setSavingPin(true)
    setPinError('')
    try {
      const res = await fetch('/api/business/set-pin', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ pin, slug: businessSlug }),
      })
      if (res.ok) { setPinSaved(true); setTimeout(() => setPinSaved(false), 3000) }
      else { const d = await res.json(); setPinError(d.error || 'Failed to save') }
    } catch {
      setPinError('Something went wrong')
    }
    setSavingPin(false)
  }

  function copyReviewLink() {
    if (!business) return
    navigator.clipboard.writeText(business.google_review_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (!authChecked) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#555', fontFamily: 'system-ui, sans-serif' }}>Loading...</div>
  }

  const reviewUrl = typeof window !== 'undefined' ? `${window.location.origin}/r/${businessSlug}` : ''

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>
              {business?.name || businessSlug}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>{reviewUrl}</p>
              <button
                onClick={copyReviewLink}
                style={{ background: 'none', border: '1px solid #333', color: copied ? '#4ade80' : '#666', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                {copied ? '✓ Copied' : 'Copy link'}
              </button>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{ background: 'none', border: '1px solid #333', color: '#666', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
          >
            Sign out
          </button>
        </div>

        {/* Redeem Coupon Box */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2d4a2d', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#4ade80', fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>🎟️ Redeem a Coupon</h2>
          <p style={{ color: '#666', fontSize: '13px', margin: '0 0 16px' }}>Customer tells you their code — enter it here to apply the discount and mark it used.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="RB-XXXX"
              value={redeemCode}
              onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setRedeemResult(null) }}
              onKeyDown={e => e.key === 'Enter' && handleRedeem()}
              maxLength={7}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #333',
                background: '#0f0f0f',
                color: '#fff',
                fontSize: '18px',
                fontFamily: 'monospace',
                letterSpacing: '3px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleRedeem()}
              disabled={redeeming || !redeemCode.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                background: redeeming || !redeemCode.trim() ? '#333' : '#4ade80',
                color: redeeming || !redeemCode.trim() ? '#666' : '#0f0f0f',
                fontSize: '14px',
                fontWeight: '600',
                cursor: redeeming || !redeemCode.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {redeeming ? 'Checking...' : 'Apply & Mark Used'}
            </button>
          </div>
          {redeemResult && (
            <p style={{ margin: '12px 0 0', fontSize: '14px', color: redeemResult.success ? '#4ade80' : '#f87171', fontWeight: '500' }}>
              {redeemResult.success ? redeemResult.message : `✗ ${redeemResult.error}`}
            </p>
          )}
        </div>

        {/* QR + Stats + PIN row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>

          {/* QR Card */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR code" style={{ width: '160px', height: '160px', borderRadius: '8px', display: 'block', margin: '0 auto 12px' }} />
            )}
            <a
              href={qrDataUrl}
              download={`${businessSlug}-qr.png`}
              style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '8px', background: '#4ade80', color: '#0f0f0f', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}
            >
              Download QR
            </a>
            <p style={{ color: '#555', fontSize: '11px', marginTop: '8px', marginBottom: 0 }}>Print and place on tables</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Total submissions', value: submissions.length },
              { label: 'Coupons issued', value: submissions.filter(s => s.coupon_generated).length },
              { label: 'Discount offered', value: business ? `${business.discount_pct}%` : '—' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{stat.label}</p>
                <p style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* PIN Setup */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>🔐 Staff Redemption PIN</h3>
            <p style={{ color: '#555', fontSize: '12px', margin: '0 0 14px', lineHeight: '1.5' }}>
              Set a 4-digit PIN. Staff enter this on the customer's phone to redeem coupons.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); setPinSaved(false) }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1px solid ${pinError ? '#f87171' : '#333'}`,
                background: '#0f0f0f',
                color: '#fff',
                fontSize: '20px',
                letterSpacing: '8px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '8px',
              }}
            />
            {pinError && <p style={{ color: '#f87171', fontSize: '12px', margin: '0 0 8px' }}>{pinError}</p>}
            <button
              onClick={handleSavePin}
              disabled={savingPin || pin.length !== 4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: pinSaved ? '#166534' : savingPin || pin.length !== 4 ? '#333' : '#4ade80',
                color: pinSaved ? '#4ade80' : savingPin || pin.length !== 4 ? '#666' : '#0f0f0f',
                fontSize: '13px',
                fontWeight: '600',
                cursor: savingPin || pin.length !== 4 ? 'not-allowed' : 'pointer',
              }}
            >
              {pinSaved ? '✓ PIN Saved' : savingPin ? 'Saving...' : 'Save PIN'}
            </button>
          </div>
        </div>

        {/* Submissions */}
        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0 0 16px' }}>
          Review submissions
        </h2>

        {loading ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>Loading...</p>
        ) : submissions.length === 0 ? (
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>No submissions yet. Share your QR code to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {submissions.map(sub => (
              <div
                key={sub.id}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', margin: '0 0 2px' }}>{sub.customer_name}</p>
                  <p style={{ color: '#555', fontSize: '12px', margin: '0 0 2px' }}>{sub.customer_phone}</p>
                  <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>{timeAgo(sub.created_at)}</p>
                </div>

                {sub.screenshot_url && (
                  <a href={sub.screenshot_url} target="_blank" rel="noreferrer">
                    <img
                      src={sub.screenshot_url}
                      alt="Review screenshot"
                      style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #333', flexShrink: 0 }}
                    />
                  </a>
                )}

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {sub.coupon_code ? (
                    <>
                      <p style={{ color: '#555', fontSize: '11px', margin: '0 0 4px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                        {sub.coupon_code}
                      </p>
                      {sub.coupon_status === 'active' && (
                        <button
                          onClick={() => handleRedeem(sub.coupon_code!)}
                          style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#4ade80', color: '#0f0f0f', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Mark Redeemed
                        </button>
                      )}
                      {sub.coupon_status === 'redeemed' && (
                        <p style={{ color: '#555', fontSize: '12px', margin: 0, fontWeight: '600' }}>✓ Redeemed</p>
                      )}
                      {sub.coupon_status === 'expired' && (
                        <p style={{ color: '#f87171', fontSize: '12px', margin: 0 }}>Expired</p>
                      )}
                      {!sub.coupon_status && (
                        <p style={{ color: '#4ade80', fontSize: '12px', margin: 0, fontWeight: '600' }}>✓ Issued</p>
                      )}
                    </>
                  ) : (
                    <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>No coupon</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
