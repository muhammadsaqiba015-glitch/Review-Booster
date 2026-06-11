import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { code, pin, adminOverride } = await req.json()

  if (!code) return NextResponse.json({ error: 'Missing coupon code' }, { status: 400 })

  // Admin override: verify JWT ownership instead of PIN
  if (adminOverride) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get coupon + business
  const { data: coupon } = await supabaseAdmin
    .from('coupons')
    .select('id, status, business_id, phone')
    .eq('code', code.toUpperCase())
    .single()

  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
  if (coupon.status === 'redeemed') return NextResponse.json({ error: 'Coupon already used' }, { status: 400 })
  if (coupon.status === 'expired') return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
  if (coupon.status !== 'active') return NextResponse.json({ error: 'Coupon is not active' }, { status: 400 })

  // Verify PIN against business
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, name, discount_pct, redemption_pin')
    .eq('id', coupon.business_id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // PIN check — skip if admin override
  if (!adminOverride) {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 })
    if (!business.redemption_pin) {
      return NextResponse.json({ error: 'Redemption PIN not set. Ask the owner to set a PIN in their dashboard.' }, { status: 400 })
    }
    if (business.redemption_pin !== pin) {
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
    }
  }

  // Mark as redeemed
  const { error: updateError } = await supabaseAdmin
    .from('coupons')
    .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
    .eq('id', coupon.id)

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
