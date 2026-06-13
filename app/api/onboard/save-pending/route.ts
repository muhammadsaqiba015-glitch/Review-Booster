import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, name, reviewUrl, discountPct, phone } = await req.json()

  if (!email || !name || !reviewUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('pending_businesses').upsert({
    email: email.trim().toLowerCase(),
    name: name.trim(),
    review_url: reviewUrl.trim(),
    discount_pct: discountPct || 15,
    phone: phone?.trim() || null,
  }, { onConflict: 'email' })

  if (error) {
    return NextResponse.json({ error: 'Failed to save details' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
