import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find by owner_id — fetch all + filter in JS to avoid UUID eq quirk
  const { data: allBiz } = await supabaseAdmin
    .from('businesses')
    .select('slug, owner_id')

  const biz = (allBiz || []).find(b => b.owner_id === user.id)
  if (!biz) return NextResponse.json({ error: 'No business found' }, { status: 404 })

  return NextResponse.json({ slug: biz.slug })
}
