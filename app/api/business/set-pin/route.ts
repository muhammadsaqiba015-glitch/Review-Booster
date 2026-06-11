import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pin, slug } = await req.json()

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('businesses')
    .update({ redemption_pin: pin })
    .eq('slug', slug)
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update PIN' }, { status: 500 })

  return NextResponse.json({ success: true })
}
