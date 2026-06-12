import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Look up by slug (text eq is fine), verify ownership in JS
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, name, slug, discount_pct, google_review_url, owner_id')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!business || business.owner_id !== user.id) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: business.id,
    name: business.name,
    slug: business.slug,
    discount_pct: business.discount_pct,
    google_review_url: business.google_review_url,
  })
}
