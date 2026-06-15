import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug, discountPct } = await req.json()
  const pct = parseInt(discountPct)

  if (!slug || isNaN(pct) || pct < 1 || pct > 100) {
    return NextResponse.json({ error: 'Discount must be between 1 and 100%' }, { status: 400 })
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
    .update({ discount_pct: pct })
    .eq('slug', slug)

  if (error) return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 })

  return NextResponse.json({ success: true, discountPct: pct })
}
