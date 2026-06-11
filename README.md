# ReviewBoost

Leave a Google review → get a discount coupon. Businesses pay only when a customer returns.

## Setup

### 1. Supabase
1. Create a project at supabase.com
2. Run `supabase-schema.sql` in the SQL editor
3. Run `supabase-functions.sql` in the SQL editor
4. Copy your project URL, anon key, and service role key

### 2. Google Places API
1. Go to console.cloud.google.com
2. Enable **Places API**
3. Create an API key
4. Find your business's Place ID at: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder

### 3. Twilio (SMS)
1. Create account at twilio.com
2. Get a phone number
3. Copy Account SID and Auth Token

### 4. Environment variables
```
cp .env.local.example .env.local
```
Fill in all values.

### 5. Add a CRON_SECRET
```
CRON_SECRET=any-random-long-string
```

### 6. Run locally
```
npm install
npm run dev
```

### 7. Deploy to Vercel
```
npx vercel
```
Vercel will automatically pick up `vercel.json` and run the cron every 5 min.

## How it works

1. Business gets a QR code at `yourapp.com/r/{slug}`
2. Customer scans → enters phone → redirected to Google review page
3. Cron polls Google Places API every 5 min
4. New review detected → coupon generated → SMS sent to customer
5. Customer returns → scans same QR → green coupon screen shows
6. Staff sees green → applies discount → coupon marked used → business charged Rs. 50

## File structure

```
app/
  r/[slug]/page.tsx        — QR landing page per business
  coupon/[code]/page.tsx   — Coupon display (green/red)
  api/
    scan/route.ts          — Logs scan, checks for existing coupon
    poll/route.ts          — Cron: detects reviews, generates coupons
    coupon/route.ts        — Marks coupon redeemed, logs billing
components/
  ScanPage.tsx             — Phone collection UI
  CouponScreen.tsx         — Green/red coupon display
lib/
  supabase.ts              — DB clients
  utils.ts                 — SMS, coupon code generation
```
