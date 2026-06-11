import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateCouponCode } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const submissionId = formData.get('submissionId') as string
  const screenshot = formData.get('screenshot') as File | null

  if (!submissionId || !screenshot) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('review_submissions')
    .select('id, business_id, customer_phone')
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // Upload screenshot to Supabase Storage for later AI verification
  let screenshotUrl: string | null = null
  try {
    const ext = screenshot.name.split('.').pop() || 'jpg'
    const path = `${submissionId}.${ext}`
    const bytes = await screenshot.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from('review-screenshots')
      .upload(path, Buffer.from(bytes), { contentType: screenshot.type, upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage.from('review-screenshots').getPublicUrl(path)
      screenshotUrl = urlData.publicUrl
    }
  } catch {
    // Storage upload is best-effort; coupon still gets issued
  }

  // Check if coupon already issued for this phone + business
  const { data: existing } = await supabaseAdmin
    .from('coupons')
    .select('code, status')
    .eq('business_id', submission.business_id)
    .eq('phone', submission.customer_phone)
    .in('status', ['active', 'pending'])
    .maybeSingle()

  let code: string
  if (existing) {
    code = existing.code
  } else {
    code = generateCouponCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: clash } = await supabaseAdmin.from('coupons').select('id').eq('code', code).maybeSingle()
      if (!clash) break
      code = generateCouponCode()
      attempts++
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: couponError } = await supabaseAdmin.from('coupons').insert({
      business_id: submission.business_id,
      phone: submission.customer_phone,
      code,
      status: 'active',
      activated_at: new Date().toISOString(),
      expires_at: expiresAt,
    })

    if (couponError) {
      return NextResponse.json({ error: 'Failed to generate coupon' }, { status: 500 })
    }
  }

  // Update submission record
  await supabaseAdmin
    .from('review_submissions')
    .update({ coupon_generated: true, coupon_code: code, screenshot_url: screenshotUrl })
    .eq('id', submissionId)

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('name, discount_pct')
    .eq('id', submission.business_id)
    .single()

  return NextResponse.json({
    couponCode: code,
    discountPct: business?.discount_pct,
    businessName: business?.name,
  })
}
