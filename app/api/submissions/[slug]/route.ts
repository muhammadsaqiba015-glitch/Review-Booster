import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Look up business by slug (text eq is fine), verify ownership in JS
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, owner_id')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!business || business.owner_id !== user.id) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Fetch all submissions, filter by business_id in JS (avoids UUID eq quirk)
  const { data: allRows, error: subError } = await supabaseAdmin
    .from('review_submissions')
    .select('id, customer_name, customer_phone, created_at, coupon_code, business_id')
    .order('created_at', { ascending: false })

  if (subError) {
    console.error('Submissions query error:', subError.message)
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  const submissions = (allRows || []).filter(s => s.business_id === business.id)
  return NextResponse.json({ submissions }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}
