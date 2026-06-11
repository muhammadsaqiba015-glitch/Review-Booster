import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateCouponCode, sendSMS, formatPKPhone } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { businessId, phone } = await req.json()

  if (!businessId || !phone) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const formattedPhone = formatPKPhone(phone)

  const { data: existing } = await supabaseAdmin
    .from('coupons')
    .select('code, status')
    .eq('business_id', businessId)
    .eq('phone', formattedPhone)
    .single()

  if (existing) {
    if (existing.status === 'active') {
      return NextResponse.json({ couponCode: existing.code })
    }
    if (existing.status === 'redeemed') {
      return NextResponse.json({ error: 'You have already used your coupon for this business.' }, { status: 400 })
    }
  }

  let code = generateCouponCode()
  let attempts = 0
  while (attempts < 5) {
    const { data: clash } = await supabaseAdmin
      .from('coupons').select('id').eq('code', code).single()
    if (!clash) break
    code = generateCouponCode()
    attempts++
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await supabaseAdmin
    .from('coupons')
    .insert({
      business_id: businessId,
      phone: formattedPhone,
      code,
      status: 'active',
      activated_at: new Date().toISOString(),
      expires_at: expiresAt,
    })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to generate coupon.' }, { status: 500 })
  }

  const { data: business } = await supabaseAdmin
    .from('businesses').select('name, discount_pct').eq('id', businessId).single()

  if (business) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const couponUrl = `${appUrl}/coupon/${code}`
    const message =
      `🎉 Shukriya! Aapka review mil gaya.\n` +
      `${business.name} coupon: ${code}\n` +
      `${couponUrl}\n` +
      `Agli visit pe show karein aur ${business.discount_pct}% discount payein!\n` +
      `Valid for 30 days.`
    await sendSMS(formattedPhone, message)
  }

  return NextResponse.json({ couponCode: code })
}