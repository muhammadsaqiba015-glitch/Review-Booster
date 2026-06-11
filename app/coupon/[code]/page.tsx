import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CouponScreen from '@/components/CouponScreen'

interface Props {
  params: { code: string }
}

export default async function CouponPage({ params }: Props) {
  const { data: coupon } = await supabaseAdmin
    .from('coupons')
    .select('*, businesses(name, discount_pct)')
    .eq('code', params.code.toUpperCase())
    .single()

  if (!coupon) notFound()

  return <CouponScreen coupon={coupon} />
}
