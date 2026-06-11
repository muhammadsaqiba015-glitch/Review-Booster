import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('slug', params.slug)
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Fetch all rows + filter in JS (PostgREST UUID eq has a known quirk)
  const { data: allRows, error: subError } = await supabaseAdmin
    .from('review_submissions')
    .select('id, customer_name, customer_phone, created_at, coupon_generated, coupon_code, screenshot_url, business_id')
    .order('created_at', { ascending: false })

  if (subError) {
    console.error('Submissions query error:', subError.message)
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  const submissions = (allRows || []).filter(s => s.business_id === business.id)

  // Fetch coupon statuses for submissions that have a coupon code
  const { data: allCoupons } = await supabaseAdmin
    .from('coupons')
    .select('code, status, expires_at')

  const couponStatusMap: Record<string, string> = {}
  for (const c of allCoupons || []) {
    couponStatusMap[c.code] = c.status
  }

  const enriched = submissions.map(s => ({
    ...s,
    coupon_status: s.coupon_code ? (couponStatusMap[s.coupon_code] ?? null) : null,
  }))

  return NextResponse.json({ submissions: enriched })
}
