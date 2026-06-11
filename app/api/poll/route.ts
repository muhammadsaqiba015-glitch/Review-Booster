import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateCouponCode, sendSMS } from '@/lib/utils'

// This endpoint is called by a cron job every 5 minutes
// Set up in Vercel cron or an external cron service
// Protected by a secret key

export async function POST(req: NextRequest) {
  // Protect this endpoint
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { processed: 0, couponsGenerated: 0, errors: [] as string[] }

  try {
    // Get all active businesses
    const { data: businesses } = await supabaseAdmin
      .from('businesses')
      .select('id, name, google_place_id, discount_pct')
      .eq('is_active', true)

    if (!businesses) return NextResponse.json(results)

    for (const business of businesses) {
      try {
        // Fetch recent reviews from Google Places API
        const reviewsRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?` +
          `place_id=${business.google_place_id}` +
          `&fields=reviews` +
          `&key=${process.env.GOOGLE_PLACES_API_KEY}`
        )
        const reviewsData = await reviewsRes.json()
        const reviews = reviewsData.result?.reviews || []

        // Get scans waiting for review (last 2 hours) — no coupon yet
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        const { data: pendingScans } = await supabaseAdmin
          .from('scans')
          .select('phone, scanned_at, device_fingerprint')
          .eq('business_id', business.id)
          .eq('scan_type', 'review')
          .gte('scanned_at', twoHoursAgo)

        if (!pendingScans || pendingScans.length === 0) continue

        for (const scan of pendingScans) {
          // Check if coupon already exists for this phone+business
          const { data: existingCoupon } = await supabaseAdmin
            .from('coupons')
            .select('id')
            .eq('business_id', business.id)
            .eq('phone', scan.phone)
            .not('status', 'eq', 'pending')
            .single()

          if (existingCoupon) continue // already processed

          // Check if a review appeared after this scan
          const scanTime = new Date(scan.scanned_at).getTime()
          const newReview = reviews.find((r: { time: number }) => {
            const reviewTime = r.time * 1000 // Google returns Unix seconds
            return reviewTime >= scanTime - 5 * 60 * 1000 // 5 min buffer
          })

          if (!newReview) continue

          // New review detected — generate coupon
          let code = generateCouponCode()

          // Ensure code is unique
          let attempts = 0
          while (attempts < 5) {
            const { data: clash } = await supabaseAdmin
              .from('coupons')
              .select('id')
              .eq('code', code)
              .single()
            if (!clash) break
            code = generateCouponCode()
            attempts++
          }

          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          // Update pending coupon to active, or create new one
          const { error: upsertError } = await supabaseAdmin
            .from('coupons')
            .upsert({
              business_id: business.id,
              phone: scan.phone,
              device_fingerprint: scan.device_fingerprint,
              code,
              status: 'active',
              activated_at: new Date().toISOString(),
              expires_at: expiresAt,
            }, {
              onConflict: 'business_id,phone',
              ignoreDuplicates: false,
            })

          if (upsertError) {
            results.errors.push(`Coupon upsert failed: ${upsertError.message}`)
            continue
          }

          // Send SMS
          const appUrl = process.env.NEXT_PUBLIC_APP_URL
          const couponUrl = `${appUrl}/coupon/${code}`
          const message =
            `🎉 Shukriya! Aapka review mil gaya.\n` +
            `Aapka ${business.name} coupon:\n` +
            `${couponUrl}\n` +
            `Agli visit pe show karein aur ${business.discount_pct}% discount payein!`

          await sendSMS(scan.phone, message)
          results.couponsGenerated++
        }

        results.processed++
      } catch (err) {
        results.errors.push(`Business ${business.id}: ${err}`)
      }
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json(results)
}
