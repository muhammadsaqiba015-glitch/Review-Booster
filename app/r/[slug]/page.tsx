import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import ScanPage from '@/components/ScanPage'

interface Props {
  params: { slug: string }
}

export default async function ReviewPage({ params }: Props) {
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, name, slug, google_review_url, discount_pct')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!business) notFound()

  return <ScanPage business={business} />
}

export async function generateMetadata({ params }: Props) {
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('name, discount_pct')
    .eq('slug', params.slug)
    .single()

  return {
    title: business ? `Review ${business.name} — Get ${business.discount_pct}% Off` : 'Review & Save',
  }
}
