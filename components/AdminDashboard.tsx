'use client'
import { useEffect, useState } from 'react'
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
}

interface Business {
  id: string
  name: string
  slug: string
  discount_pct: number
  google_review_url: string
}

export default function AdminDashboard({ businessSlug }: { businessSlug: string }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)

  // Auth check on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }
      setSession(session)
      setAuthChecked(true)
    })
  }, [router])

  // Generate QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      QRCode.toDataURL(`${window.location.origin}/r/${businessSlug}`, { width: 240, margin: 2 })
        .then(setQrDataUrl)
    }
  }, [businessSlug])

  // Fetch business + submissions once auth is confirmed
  useEffect(() => {
    if (!authChecked || !session) return
    fetchBusiness()
  }, [authChecked, session])

  useEffect(() => {
    if (!business) return
    fetchSubmissions()
    const interval = setInterval(fetchSubmissions, 10000)
    return () => clearInterval(interval)
  }, [business])

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session!.access_token}`,
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

  async function handleGenerateCoupon(submission: Submission) {
    if (submission.coupon_generated || !business) return
    setGenerating(submission.id)
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ businessId: business.id, phone: submission.customer_phone }),
      })
      const data = await res.json()
      if (data.couponCode) {
        await fetch('/api/submission/mark-generated', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ submissionId: submission.id, couponCode: data.couponCode }),
        })
        fetchSubmissions()
      }
    } catch (err) {
      console.error('Failed to generate coupon:', err)
    }
    setGenerating(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (!authChecked) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#555', fontFamily: 'system-ui, sans-serif' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>
              {business?.name || businessSlug}
            </h1>
            <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
              reviewboost.app/r/{businessSlug}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={{ background: 'none', border: '1px solid #333', color: '#666', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
          >
            Sign out
          </button>
        </div>

        {/* QR + Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px', marginBottom: '40px', alignItems: 'start' }}>
          {/* QR Card */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px', textAlign: 'center', minWidth: '200px' }}>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR code" style={{ width: '180px', height: '180px', borderRadius: '8px', display: 'block', margin: '0 auto 12px' }} />
            )}
            <a
              href={qrDataUrl}
              download={`${businessSlug}-qr.png`}
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                borderRadius: '8px',
                background: '#4ade80',
                color: '#0f0f0f',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Download QR
            </a>
            <p style={{ color: '#555', fontSize: '11px', marginTop: '10px', marginBottom: 0 }}>
              Print and place on tables
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Total submissions', value: submissions.length },
              { label: 'Coupons issued', value: submissions.filter(s => s.coupon_generated).length },
              { label: 'Discount offered', value: business ? `${business.discount_pct}%` : '—' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px' }}>
                <p style={{ color: '#fff', fontSize: '28px', fontWeight: '700', margin: '0 0 4px' }}>{stat.value}</p>
                <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
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
            <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>
              No submissions yet. Share your QR code to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {submissions.map(sub => (
              <div
                key={sub.id}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                {/* Customer info */}
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', margin: '0 0 4px' }}>
                    {sub.customer_name}
                  </p>
                  <p style={{ color: '#666', fontSize: '13px', margin: '0 0 4px' }}>
                    {sub.customer_phone}
                  </p>
                  <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>
                    {new Date(sub.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Screenshot thumbnail */}
                {sub.screenshot_url && (
                  <a href={sub.screenshot_url} target="_blank" rel="noreferrer">
                    <img
                      src={sub.screenshot_url}
                      alt="Review screenshot"
                      style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #333', flexShrink: 0 }}
                    />
                  </a>
                )}

                {/* Coupon status / action */}
                {sub.coupon_generated ? (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>
                      ✓ Coupon issued
                    </p>
                    <p style={{ color: '#555', fontSize: '12px', margin: 0, fontFamily: 'monospace', letterSpacing: '1px' }}>
                      {sub.coupon_code}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleGenerateCoupon(sub)}
                    disabled={generating === sub.id}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: generating === sub.id ? '#333' : '#4ade80',
                      color: generating === sub.id ? '#888' : '#0f0f0f',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: generating === sub.id ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {generating === sub.id ? 'Generating...' : 'Issue coupon'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
