-- Run this in Supabase SQL editor alongside the main schema
-- Atomic increment to avoid race conditions on billing totals

create or replace function increment_business_totals(biz_id uuid, charge integer)
returns void as $$
begin
  update businesses
  set
    total_redemptions = total_redemptions + 1,
    total_owed_pkr = total_owed_pkr + charge
  where id = biz_id;
end;
$$ language plpgsql;
