import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
    const { submissionId, couponCode } = await req.json()

    if (!submissionId || !couponCode) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
        .from('review_submissions')
        .update({ coupon_generated: true, coupon_code: couponCode })
        .eq('id', submissionId)

    if (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}