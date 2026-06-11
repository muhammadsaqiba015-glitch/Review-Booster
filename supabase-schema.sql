-- ============================================
-- ReviewBoost - Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Businesses table
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,               -- used in QR URL: /r/{slug}
  google_place_id text not null,           -- from Google Business Profile
  google_review_url text not null,         -- direct link to leave a review
  discount_pct integer not null default 15, -- % discount offered
  phone text,                              -- owner WhatsApp number
  owner_id uuid references auth.users(id), -- set when owner signs up via /onboard
  is_active boolean default true,
  total_redemptions integer default 0,
  total_owed_pkr integer default 0,        -- total Rs owed to you
  created_at timestamptz default now()
);

create index on businesses(owner_id);

-- ============================================
-- Migration: if businesses table already exists, run:
--   alter table businesses add column if not exists owner_id uuid references auth.users(id);
--   create index if not exists businesses_owner_id_idx on businesses(owner_id);
-- ============================================

-- Scans table (every QR scan is logged here)
create table scans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  phone text,                              -- collected on landing page
  device_fingerprint text,                 -- browser fingerprint
  scan_type text check (scan_type in ('review', 'redeem')),
  ip_address text,
  scanned_at timestamptz default now()
);

-- Coupons table
create table coupons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  phone text not null,                     -- who earned it
  device_fingerprint text,
  code text unique not null,               -- e.g. RB-X7K2
  status text check (status in ('pending', 'active', 'redeemed', 'expired')) default 'pending',
  -- pending = review not detected yet
  -- active  = review detected, coupon sent
  -- redeemed = used at dhaba
  -- expired = never used, 30 days passed
  created_at timestamptz default now(),
  activated_at timestamptz,               -- when review was detected
  redeemed_at timestamptz,
  expires_at timestamptz                  -- 30 days from activated_at
);

-- Billing table (one row per redemption = one charge)
create table billing_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  coupon_id uuid references coupons(id),
  amount_pkr integer not null default 50,  -- Rs. 50 per redemption
  created_at timestamptz default now()
);

-- ============================================
-- Indexes for performance
-- ============================================
create index on scans(business_id);
create index on scans(phone);
create index on scans(device_fingerprint);
create index on coupons(phone);
create index on coupons(code);
create index on coupons(business_id, status);
create index on billing_events(business_id);

-- ============================================
-- Row Level Security (RLS)
-- Disable for now during dev, enable before go-live
-- ============================================
alter table businesses enable row level security;
alter table scans enable row level security;
alter table coupons enable row level security;
alter table billing_events enable row level security;

-- Allow service role full access (your backend uses this)
create policy "service role full access" on businesses for all using (true);
create policy "service role full access" on scans for all using (true);
create policy "service role full access" on coupons for all using (true);
create policy "service role full access" on billing_events for all using (true);

-- ============================================
-- Review submissions table
-- ============================================
create table if not exists review_submissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  coupon_generated boolean default false,
  coupon_code text,
  screenshot_url text,              -- uploaded proof of review (for AI verification later)
  created_at timestamptz default now()
);

create index on review_submissions(business_id);
create index on review_submissions(customer_phone);

alter table review_submissions enable row level security;
create policy "service role full access" on review_submissions for all using (true);

-- ============================================
-- Storage bucket for review screenshots
-- Run in Supabase dashboard > Storage > New bucket:
--   Name: review-screenshots
--   Public: true (so AI can fetch the URL later)
-- ============================================

-- ============================================
-- Migration: add screenshot_url if table already exists
-- Only run this if you created the table before this was added:
--   alter table review_submissions add column if not exists screenshot_url text;
-- ============================================

-- ============================================
-- Sample business for testing
-- ============================================
insert into businesses (name, slug, google_place_id, google_review_url, discount_pct, phone)
values (
  'Test Dhaba',
  'test-dhaba',
  'ChIJXXXXXXXXXXXX',  -- replace with real Google Place ID
  'https://search.google.com/local/writereview?placeid=ChIJXXXXXXXXXXXX',
  15,
  '+923001234567'
);
