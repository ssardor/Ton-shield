-- TON Shield AI – Supabase schema bootstrap
-- Run inside Supabase SQL editor.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'risk_level_enum') then
    create type risk_level_enum as enum ('SAFE', 'WARNING', 'CRITICAL');
  end if;
end $$;

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  telegram_id text unique,
  telegram_username text,
  main_wallet_address text,
  risk_level risk_level_enum default 'SAFE',
  risk_score integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  simulation_enabled boolean default true,
  phishing_alerts_enabled boolean default true,
  notifications_enabled boolean default false,
  dashboard_language text default 'en',
  preferences jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.transaction_assessments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  wallet_address text not null,
  target_address text not null,
  origin_domain text,
  amount_nanoton numeric(40,0),
  payload_opcode text,
  target_snapshot jsonb default '{}'::jsonb,
  signals jsonb not null default '[]'::jsonb,
  risk_level risk_level_enum not null,
  risk_score integer not null,
  ai_explanation text,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.jetton_assessments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  wallet_address text,
  jetton_address text not null,
  admin_address text,
  holder_count integer,
  metadata jsonb default '{}'::jsonb,
  signals jsonb not null default '[]'::jsonb,
  risk_level risk_level_enum not null,
  risk_score integer not null,
  ai_verdict text,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.link_scans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  url text not null,
  normalized_domain text not null,
  domain_age_days integer,
  similarity_target text,
  similarity_score numeric(5,2),
  ssl_valid boolean,
  is_redirecting boolean default false,
  redirect_chain text[] default '{}'::text[],
  signals jsonb not null default '[]'::jsonb,
  risk_level risk_level_enum not null,
  risk_score integer not null,
  ai_summary text,
  raw_analysis jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.link_scanner_whitelist (
  domain text primary key,
  display_name text,
  last_reviewed timestamptz default now()
);

create table if not exists public.session_tokens (
  token uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  wallet_address text,
  context text check (context in ('extension', 'telegram')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_profiles_wallet on public.profiles (main_wallet_address);
create index if not exists idx_tx_assessments_wallet on public.transaction_assessments (wallet_address);
create index if not exists idx_tx_assessments_profile on public.transaction_assessments (profile_id, created_at desc);
create index if not exists idx_jetton_assessments_profile on public.jetton_assessments (profile_id, created_at desc);
create index if not exists idx_link_scans_domain on public.link_scans (normalized_domain);
create index if not exists idx_session_tokens_expiry on public.session_tokens (expires_at);

create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

create trigger user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.transaction_assessments enable row level security;
alter table public.jetton_assessments enable row level security;
alter table public.link_scans enable row level security;
alter table public.session_tokens enable row level security;

create policy "Profiles readable by owner"
  on public.profiles
  for select
  using (auth.uid() = auth_user_id or auth.role() = 'service_role');

create policy "Profiles upsert by owner"
  on public.profiles
  for insert
  with check (auth.uid() = auth_user_id);

create policy "Settings by owner"
  on public.user_settings
  for all
  using (auth.uid() = profile_id or auth.role() = 'service_role')
  with check (auth.uid() = profile_id or auth.role() = 'service_role');

create policy "Tx assessments owner access"
  on public.transaction_assessments
  for all
  using (
    profile_id is null
    or auth.uid() = profile_id
    or auth.role() = 'service_role'
  )
  with check (
    profile_id is null
    or auth.uid() = profile_id
    or auth.role() = 'service_role'
  );

create policy "Jetton assessments owner access"
  on public.jetton_assessments
  for all
  using (
    profile_id is null
    or auth.uid() = profile_id
    or auth.role() = 'service_role'
  )
  with check (
    profile_id is null
    or auth.uid() = profile_id
    or auth.role() = 'service_role'
  );

create policy "Link scans owner access"
  on public.link_scans
  for all
  using (
    profile_id is null
    or auth.uid() = profile_id
    or auth.role() = 'service_role'
  )
  with check (
    profile_id is null
    or auth.uid() = profile_id
    or auth.role() = 'service_role'
  );

create policy "Session tokens owner access"
  on public.session_tokens
  for all
  using (auth.uid() = profile_id or auth.role() = 'service_role')
  with check (auth.uid() = profile_id or auth.role() = 'service_role');

insert into public.link_scanner_whitelist (domain, display_name)
values
  ('ston.fi', 'Ston.fi DEX'),
  ('fragment.com', 'Fragment Auctions'),
  ('getgems.io', 'Getgems Marketplace')
on conflict (domain) do nothing;

create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.user_settings (profile_id) values (new.id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_settings_seed on public.profiles;
create trigger profiles_settings_seed
after insert on public.profiles
for each row execute procedure public.handle_new_profile();
