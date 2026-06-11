import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateUniqueSlug, extractPlaceId } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Idempotent: return existing business if owner already has one
  const { data: existing } = await supabaseAdmin
    .from('businesses')
    .select('slug')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ slug: existing.slug })

  const { name, reviewUrl, discountPct, phone } = await req.json()

  if (!name || !reviewUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

  return NextResponse.json({ slug })
}
