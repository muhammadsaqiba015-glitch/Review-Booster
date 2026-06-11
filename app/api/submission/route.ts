import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { formatPKPhone } from '@/lib/utils'

export async function POST(req: NextRequest) {
    const { businessId, customerName, customerPhone } = await req.json()

    if (!businessId || !customerName || !customerPhone) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const formattedPhone = formatPKPhone(customerPhone)

    // Save submission
    const { data, error } = await supabaseAdmin
        .from('review_submissions')
        .insert({
            business_id: businessId,
            customer_name: customerName,
            customer_phone: formattedPhone,
        })
        .select('id')
        .single()

    if (error) {
        return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    return NextResponse.json({ success: true, submissionId: data.id })
}