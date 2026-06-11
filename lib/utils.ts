import twilio from 'twilio'
import { SupabaseClient } from '@supabase/supabase-js'

// Generate a human-readable coupon code e.g. RB-X7K2
export function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusing chars
  let code = 'RB-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Send SMS via Twilio
export async function sendSMS(to: string, body: string): Promise<boolean> {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    })
    return true
  } catch (err) {
    console.error('SMS failed:', err)
    return false
  }
}

// Generate a URL-safe slug from a business name
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

// Find a unique slug by appending a counter if the base is taken
export async function generateUniqueSlug(name: string, db: SupabaseClient): Promise<string> {
  const base = nameToSlug(name)
  let slug = base
  let counter = 2
  while (true) {
    const { data } = await db.from('businesses').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${counter++}`
  }
}

// Extract Google Place ID from a review URL if present
export function extractPlaceId(url: string): string | null {
  const match = url.match(/[?&]placeid=([^&]+)/i) || url.match(/[?&]place_id=([^&]+)/i)
  return match ? decodeURIComponent(match[1]) : null
}

// Format Pakistani phone number to E.164
export function formatPKPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('92')) return `+${digits}`
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`
  return `+92${digits}`
}
