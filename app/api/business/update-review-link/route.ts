import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractPlaceId } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug, reviewUrl } = await req.json()

  if (!slug || !reviewUrl?.trim()) {
    return NextResponse.json({ error: 'Missing review link' }, { status: 400 })
  }
  if (!reviewUrl.includes('google.com') && !reviewUrl.includes('g.page')) {
    return NextResponse.json({ error: 'Must be a Google Maps or review link' }, { status: 400 })
  }

  // Verify ownership (fetch by slug, compare owner in JS to avoid UUID eq quirk)
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, owner_id')
    .eq('slug', slug)
    .maybeSingle()

  if (!business || business.owner_id !== user.id) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('businesses')
    .update({
      google_review_url: reviewUrl.trim(),
      google_place_id: extractPlaceId(reviewUrl) || 'manual',
    })
    .eq('slug', slug)

  if (error) return NextResponse.json({ error: 'Failed to update review link' }, { status: 500 })

  return NextResponse.json({ success: true, reviewUrl: reviewUrl.trim() })
}
