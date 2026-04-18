-- Run this SQL in the Supabase SQL editor for project:
-- https://cewcqpzutryovyrvyior.supabase.co

create table if not exists public.app_users (
  id text primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('driver', 'company_manager')),
  password text not null,
  section text not null check (section in ('driver', 'warehouse')),
  source text not null default 'storefront-auth',
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_users
  add column if not exists profile_data jsonb not null default '{}'::jsonb;

create unique index if not exists app_users_email_role_key
  on public.app_users (lower(email), role);

create table if not exists public.live_bids (
  id text primary key,
  source_load_id text,
  customer_name text,
  bid_data jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists live_bids_source_load_id_idx
  on public.live_bids (source_load_id);

create table if not exists public.driver_locations (
  id text primary key,
  shipment_id text,
  load_id text,
  driver text,
  latitude double precision,
  longitude double precision,
  speed_mph integer,
  recorded_at timestamptz,
  source text,
  received_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.driver_messages (
  id text primary key,
  shipment_id text,
  load_id text,
  driver text,
  message text,
  category text,
  priority text,
  sent_at timestamptz,
  received_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dashboard_snapshots (
  id text primary key,
  app_name text not null,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_users enable row level security;
alter table public.live_bids enable row level security;
alter table public.driver_locations enable row level security;
alter table public.driver_messages enable row level security;
alter table public.dashboard_snapshots enable row level security;

drop policy if exists "anon full access app_users" on public.app_users;
create policy "anon full access app_users"
  on public.app_users
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access live_bids" on public.live_bids;
create policy "anon full access live_bids"
  on public.live_bids
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access driver_locations" on public.driver_locations;
create policy "anon full access driver_locations"
  on public.driver_locations
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access driver_messages" on public.driver_messages;
create policy "anon full access driver_messages"
  on public.driver_messages
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access dashboard_snapshots" on public.dashboard_snapshots;
create policy "anon full access dashboard_snapshots"
  on public.dashboard_snapshots
  for all
  to anon
  using (true)
  with check (true);
