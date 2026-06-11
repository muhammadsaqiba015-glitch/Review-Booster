import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { formatPKPhone } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')
  if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 })

  const formatted = formatPKPhone(decodeURIComponent(phone))

  const { data: coupons } = await supabaseAdmin
    .from('coupons')
    .select('code, status, expires_at, activated_at, businesses(name, discount_pct, slug)')
    .eq('phone', formatted)
    .order('activated_at', { ascending: false })

  return NextResponse.json({ coupons: coupons || [] })
}
