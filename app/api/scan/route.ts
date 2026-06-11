import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { formatPKPhone } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { businessId, phone, scanType } = await req.json()

  if (!businessId || !phone || !scanType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const formattedPhone = formatPKPhone(phone)
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  // Simple device fingerprint from headers
  const deviceFp = Buffer.from(
    (req.headers.get('user-agent') || '') + ip
  ).toString('base64').slice(0, 32)

  // Log the scan
  await supabaseAdmin.from('scans').insert({
    business_id: businessId,
    phone: formattedPhone,
    device_fingerprint: deviceFp,
    scan_type: scanType,
    ip_address: ip,
  })

  // Check if this phone already has an active (unused) coupon for this business
  const { data: existingCoupon } = await supabaseAdmin
    .from('coupons')
    .select('code')
    .eq('business_id', businessId)
    .eq('phone', formattedPhone)
    .eq('status', 'active')
    .single()

  if (existingCoupon) {
    // They have an unused coupon — send them to redeem it
    return NextResponse.json({
      hasCoupon: true,
      couponCode: existingCoupon.code,
    })
  }

  // No coupon yet — let them go leave a review
  return NextResponse.json({ hasCoupon: false })
}
