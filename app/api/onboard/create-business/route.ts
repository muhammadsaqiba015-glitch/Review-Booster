import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateUniqueSlug, extractPlaceId } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Idempotent: return existing business if owner already has one (filter in JS to avoid UUID eq quirk)
  const { data: allBiz } = await supabaseAdmin.from('businesses').select('slug, owner_id')
  const existing = (allBiz || []).find(b => b.owner_id === user.id)
  if (existing) return NextResponse.json({ slug: existing.slug })

  // Details may come from the request body (same-device localStorage) OR
  // from the server-side pending_businesses table (cross-device, keyed by email)
  const body = await req.json().catch(() => ({}))
  let { name, reviewUrl, discountPct, phone } = body

  if (!name || !reviewUrl) {
    const email = user.email?.toLowerCase()
    if (email) {
      const { data: pending } = await supabaseAdmin
        .from('pending_businesses')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      if (pending) {
        name = pending.name
        reviewUrl = pending.review_url
        discountPct = pending.discount_pct
        phone = pending.phone
      }
    }
  }

  if (!name || !reviewUrl) {
    return NextResponse.json({ error: 'No pending business details found' }, { status: 400 })
  }

  if (!reviewUrl.includes('google.com') && !reviewUrl.includes('g.page')) {
    return NextResponse.json({ error: 'Please provide a valid Google review URL' }, { status: 400 })
  }

  const slug = await generateUniqueSlug(name, supabaseAdmin)
  const placeId = extractPlaceId(reviewUrl) || 'manual'

  const { error: insertError } = await supabaseAdmin.from('businesses').insert({
    name: name.trim(),
    slug,
    google_place_id: placeId,
    google_review_url: reviewUrl.trim(),
    discount_pct: discountPct || 15,
    phone: phone?.trim() || null,
    owner_id: user.id,
    is_active: true,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }

  // Clean up the pending record
  if (user.email) {
    await supabaseAdmin.from('pending_businesses').delete().eq('email', user.email.toLowerCase())
  }

  return NextResponse.json({ slug })
}
