-- GB Wheels: core schema
-- Run in the Supabase SQL editor, or via `supabase db push`.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('user', 'super_admin', 'listing_manager', 'sales_agent', 'photographer');
create type public.listing_status as enum ('draft', 'pending', 'active', 'rejected', 'reserved', 'sold', 'expired');
create type public.customs_status as enum ('customs_paid', 'ncp', 'other', 'unknown');
create type public.registration_status as enum ('registered', 'unregistered', 'unknown');
create type public.selling_mode as enum ('standard', 'managed');
create type public.inquiry_status as enum (
  'new', 'buyer_contacted', 'seller_contacted', 'viewing_arranged',
  'negotiation', 'deal_confirmed', 'completed', 'unsuccessful'
);
create type public.brokerage_type as enum ('fixed', 'percentage', 'tiered', 'custom', 'zero');
create type public.deal_status as enum ('requested', 'agreed', 'listed', 'negotiating', 'completed', 'cancelled');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  email text,
  district text,
  role public.user_role not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role helpers. SECURITY DEFINER so RLS policies can call them without recursion.
create or replace function public.current_role_name()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('super_admin','listing_manager','sales_agent','photographer'), false)
$$;

create or replace function public.has_role(roles public.user_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = any (roles), false)
$$;

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users must never be able to promote themselves.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(array['super_admin']::public.user_role[]) then
    new.role = old.role;
    new.is_active = old.is_active;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
create sequence public.vehicle_ref_seq start 1001;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('GBW-' || nextval('public.vehicle_ref_seq')),
  slug text not null unique,
  seller_id uuid not null references public.profiles (id) on delete cascade,

  brand text not null,
  model text not null,
  variant text,
  model_year smallint not null check (model_year between 1980 and 2100),
  registration_year smallint check (registration_year between 1980 and 2100),
  engine_cc integer check (engine_cc > 0),
  color text,
  fuel_type text,
  transmission text,
  steering_side text,
  import_origin text,

  mileage_km integer check (mileage_km >= 0),
  condition text,
  engine_condition text,
  suspension_condition text,
  tyre_condition text,
  accident_history text,
  repainted_panels text,
  known_defects text,
  documents_available text,
  registration_status public.registration_status not null default 'unknown',
  customs_status public.customs_status not null default 'unknown',

  district text not null,
  town text,
  description text,

  -- Pricing. seller_asking_price is private to the seller and staff.
  seller_asking_price bigint not null check (seller_asking_price > 0),
  advertised_price bigint not null check (advertised_price > 0),

  selling_mode public.selling_mode not null default 'standard',
  status public.listing_status not null default 'draft',
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  rejection_reason text,
  view_count integer not null default 0,

  -- Verification flags: only staff may set these (see guard trigger).
  docs_reviewed boolean not null default false,
  gbw_inspected boolean not null default false,
  independently_verified boolean not null default false,

  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_status_idx on public.vehicles (status);
create index vehicles_seller_idx on public.vehicles (seller_id);
create index vehicles_brand_model_idx on public.vehicles (brand, model);
create index vehicles_district_idx on public.vehicles (district);
create index vehicles_price_idx on public.vehicles (advertised_price);
create index vehicles_year_idx on public.vehicles (model_year);
create index vehicles_featured_idx on public.vehicles (is_featured) where is_featured;
create trigger vehicles_updated before update on public.vehicles
  for each row execute function public.set_updated_at();

-- Sellers cannot approve, feature, verify or alter the advertised price of their own listing.
create or replace function public.guard_vehicle_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  staff boolean := public.has_role(array['super_admin','listing_manager']::public.user_role[]);
begin
  if auth.uid() is null or staff then
    return new; -- service role / server-side jobs / authorised admins
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'pending') then
      raise exception 'Listings can only be created as draft or pending';
    end if;
    new.is_featured := false;
    new.is_demo := false;
    new.docs_reviewed := false;
    new.gbw_inspected := false;
    new.independently_verified := false;
    new.view_count := 0;
    new.rejection_reason := null;
    new.published_at := null;
    -- Standard listings: advertised price equals the seller's price.
    -- Managed listings: advertised price is set by staff after agreement.
    new.advertised_price := new.seller_asking_price;
    return new;
  end if;

  -- UPDATE by the owning seller
  new.is_featured := old.is_featured;
  new.is_demo := old.is_demo;
  new.docs_reviewed := old.docs_reviewed;
  new.gbw_inspected := old.gbw_inspected;
  new.independently_verified := old.independently_verified;
  new.view_count := old.view_count;
  new.rejection_reason := old.rejection_reason;
  new.published_at := old.published_at;
  new.reference := old.reference;
  new.seller_id := old.seller_id;
  new.selling_mode := old.selling_mode;

  if old.selling_mode = 'managed' then
    new.advertised_price := old.advertised_price;
    new.seller_asking_price := old.seller_asking_price;
  else
    new.advertised_price := new.seller_asking_price;
  end if;

  -- Allowed seller transitions only.
  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft'    and new.status in ('draft','pending')) or
      (old.status = 'rejected' and new.status in ('draft','pending')) or
      (old.status = 'active'   and new.status in ('reserved','sold')) or
      (old.status = 'reserved' and new.status in ('active','sold'))
    ) then
      raise exception 'Status change from % to % is not allowed', old.status, new.status;
    end if;
  elsif old.status = 'active' then
    -- Editing a live listing sends it back for review.
    new.status := 'pending';
  end if;

  return new;
end $$;
create trigger vehicles_guard before insert or update on public.vehicles
  for each row execute function public.guard_vehicle_write();

-- ---------------------------------------------------------------------------
-- vehicle_images
-- ---------------------------------------------------------------------------
create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  storage_path text not null,
  url text not null,
  angle text,
  alt_text text,
  sort_order smallint not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index vehicle_images_vehicle_idx on public.vehicle_images (vehicle_id, sort_order);

-- ---------------------------------------------------------------------------
-- inquiries (leads)
-- ---------------------------------------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  buyer_name text not null check (char_length(buyer_name) between 2 and 120),
  buyer_phone text not null check (char_length(buyer_phone) between 7 and 20),
  message text check (char_length(message) <= 2000),
  channel text not null default 'form' check (channel in ('form', 'whatsapp', 'call')),
  status public.inquiry_status not null default 'new',
  assigned_to uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_vehicle_idx on public.inquiries (vehicle_id);
create index inquiries_status_idx on public.inquiries (status);
create index inquiries_assigned_idx on public.inquiries (assigned_to);
create trigger inquiries_updated before update on public.inquiries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brokerage_rules
-- ---------------------------------------------------------------------------
create table public.brokerage_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.brokerage_type not null,
  fixed_amount bigint check (fixed_amount >= 0),
  percentage numeric(5,2) check (percentage >= 0 and percentage <= 100),
  -- tiers: [{"up_to": 1000000, "amount": 30000}, {"up_to": null, "amount": 60000}]
  tiers jsonb,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brokerage_rule_shape check (
    (type = 'fixed'      and fixed_amount is not null) or
    (type = 'percentage' and percentage   is not null) or
    (type = 'tiered'     and tiers        is not null) or
    (type in ('custom', 'zero'))
  )
);
create unique index brokerage_one_default on public.brokerage_rules (is_default) where is_default;
create trigger brokerage_rules_updated before update on public.brokerage_rules
  for each row execute function public.set_updated_at();

-- Server-side brokerage calculation. The frontend must never be the source of truth.
create or replace function public.calculate_brokerage(
  p_rule_id uuid,
  p_seller_amount bigint,
  p_custom_amount bigint default null
) returns table (brokerage_type public.brokerage_type, brokerage_amount bigint, advertised_price bigint)
language plpgsql stable set search_path = public as $$
declare
  r public.brokerage_rules;
  fee bigint := 0;
  tier jsonb;
begin
  if p_seller_amount is null or p_seller_amount <= 0 then
    raise exception 'Seller amount must be positive';
  end if;

  select * into r from public.brokerage_rules where id = p_rule_id and is_active;
  if not found then
    raise exception 'Brokerage rule not found or inactive';
  end if;

  if r.type = 'fixed' then
    fee := r.fixed_amount;
  elsif r.type = 'percentage' then
    fee := round(p_seller_amount * r.percentage / 100.0);
  elsif r.type = 'tiered' then
    for tier in select * from jsonb_array_elements(r.tiers) loop
      if (tier ->> 'up_to') is null or p_seller_amount <= (tier ->> 'up_to')::bigint then
        fee := (tier ->> 'amount')::bigint;
        exit;
      end if;
    end loop;
  elsif r.type = 'custom' then
    if p_custom_amount is null or p_custom_amount < 0 then
      raise exception 'Custom brokerage requires a non-negative amount';
    end if;
    fee := p_custom_amount;
  else
    fee := 0;
  end if;

  return query select r.type, fee, p_seller_amount + fee;
end $$;

-- ---------------------------------------------------------------------------
-- managed_sales
-- ---------------------------------------------------------------------------
create table public.managed_sales (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete set null,
  seller_id uuid references public.profiles (id) on delete set null,

  contact_name text not null,
  contact_phone text not null,
  preferred_contact text not null default 'phone' check (preferred_contact in ('phone', 'whatsapp', 'email')),
  vehicle_details text not null,
  location text not null,
  description text,

  seller_asking_price bigint not null check (seller_asking_price > 0),
  brokerage_rule_id uuid references public.brokerage_rules (id),
  brokerage_type public.brokerage_type,
  brokerage_amount bigint check (brokerage_amount >= 0),
  advertised_price bigint check (advertised_price > 0),
  final_selling_price bigint check (final_selling_price > 0),
  seller_agreed boolean not null default false,
  seller_agreed_at timestamptz,
  deal_status public.deal_status not null default 'requested',
  assigned_to uuid references public.profiles (id) on delete set null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index managed_sales_status_idx on public.managed_sales (deal_status);
create index managed_sales_seller_idx on public.managed_sales (seller_id);
create trigger managed_sales_updated before update on public.managed_sales
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- transactions (brokerage revenue counts ONLY when status = 'completed')
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete set null,
  managed_sale_id uuid references public.managed_sales (id) on delete set null,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  seller_amount bigint not null check (seller_amount >= 0),
  brokerage_amount bigint not null default 0 check (brokerage_amount >= 0),
  final_selling_price bigint not null check (final_selling_price > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint completed_has_date check (status <> 'completed' or completed_at is not null)
);
create index transactions_status_idx on public.transactions (status);
create trigger transactions_updated before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- favorites, notifications, reports, activity_logs
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 120),
  details text check (char_length(details) <= 2000),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);

-- Default brokerage rule so the managed-sale flow works out of the box.
insert into public.brokerage_rules (name, type, fixed_amount, is_default)
values ('Standard fixed fee (edit in admin)', 'fixed', 50000, true);
