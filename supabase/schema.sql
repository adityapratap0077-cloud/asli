-- ASLI orders table. Run once in the Supabase SQL editor.
-- All access goes through the Next.js /api/orders route using the
-- service-role key, so RLS stays locked down with no public policies.

create table if not exists orders (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  address text not null,
  city text not null,
  pincode text not null,
  product text not null,
  color text not null,
  design text,
  custom_text text,
  method text not null check (method in ('upi', 'paypal')),
  payment_ref text not null,
  payer_email text,
  total integer not null,
  status text not null default 'payment_pending'
    check (status in ('payment_pending', 'verified', 'in_print', 'shipped', 'cancelled'))
);

alter table orders enable row level security;

-- No public policies on purpose: the API route uses the service-role key.
-- If you ever need direct dashboard access from the Supabase console,
-- use the Table Editor there (it bypasses RLS for project owners).

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);

-- 2026-09-23: garment size + Qikink fulfillment columns.
-- Idempotent: safe to re-run on an existing table.
alter table orders add column if not exists size text not null default 'M';
alter table orders add column if not exists product_id text not null default '';
alter table orders add column if not exists state text not null default '';
alter table orders add column if not exists country_code text not null default 'IN';
alter table orders add column if not exists qikink_order_id text;
alter table orders add column if not exists qikink_forwarded_at timestamptz;
alter table orders add column if not exists qikink_error_log jsonb;
