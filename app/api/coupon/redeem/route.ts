import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { code, pin, adminOverride, businessId } = await req.json()

  if (!code) return NextResponse.json({ error: 'Missing coupon code' }, { status: 400 })

  // adminOverride is set by the admin dashboard — no PIN needed, ownership is
  // implicit since only authenticated admins can see coupon codes in their dashboard

  // Fetch all coupons and filter in JS (PostgREST UUID eq has a known quirk)
  const { data: allCoupons, error: fetchError } = await supabaseAdmin
    .from('coupons')
    .select('id, code, status, business_id, phone, businesses(id, name, discount_pct)')

  if (fetchError) {
    console.error('Coupon fetch error:', fetchError.message)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }

  const coupon = (allCoupons || []).find(c => c.code === code.toUpperCase()) ?? null

  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  if (coupon.status === 'redeemed') return NextResponse.json({ error: 'Coupon already used' }, { status: 400 })
  if (coupon.status === 'expired') return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
  if (coupon.status !== 'active') return NextResponse.json({ error: 'Coupon is not active' }, { status: 400 })

  const business = Array.isArray(coupon.businesses) ? coupon.businesses[0] : coupon.businesses
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Cross-business guard: admin can only redeem coupons of the business they're viewing
  if (adminOverride && businessId && coupon.business_id !== businessId) {
    return NextResponse.json({ error: 'This coupon belongs to a different business' }, { status: 403 })
  }

  // PIN check — skip if admin override
  if (!adminOverride) {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 })
    // Fetch all businesses + find by id in JS (avoids UUID eq quirk)
    const { data: allBiz } = await supabaseAdmin
      .from('businesses')
      .select('id, redemption_pin')
    const biz = (allBiz || []).find(b => b.id === coupon.business_id)
    const redemptionPin = biz?.redemption_pin
    if (!redemptionPin) {
      return NextResponse.json({ error: 'Redemption PIN not set. Ask the owner to set a PIN in their dashboard.' }, { status: 400 })
    }
    if (redemptionPin !== pin) {
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
    }
  }

  // Mark as redeemed — filter by code (text) to avoid UUID eq quirk
  const { error: updateError } = await supabaseAdmin
    .from('coupons')
    .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
    .eq('code', coupon.code)

  if (updateError) return NextResponse.json({ error: 'Failed to redeem' }, { status: 500 })

  // Create billing event
  const charge = parseInt(process.env.CHARGE_PER_REDEMPTION_PKR || '50')
  await supabaseAdmin.from('billing_events').insert({
    business_id: coupon.business_id,
    coupon_id: coupon.id,
    amount_pkr: charge,
  })

  // Update business totals
  await supabaseAdmin.rpc('increment_business_totals', {
    biz_id: coupon.business_id,
    charge,
  })

  return NextResponse.json({ success: true, businessName: business.name, discountPct: business.discount_pct })
}
