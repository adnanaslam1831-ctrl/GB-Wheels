-- GB Wheels schema for Postgres (Neon). Idempotent: safe to run on every deploy.
-- All access goes through the Next.js server with the DATABASE_URL credential; the browser never talks to the DB.
-- Authorization (who may read/write what) is enforced in server code under src/lib and src/app/actions.

do $$ begin create type user_role as enum ('user','super_admin','listing_manager','sales_agent','photographer'); exception when duplicate_object then null; end $$;
do $$ begin create type listing_status as enum ('draft','pending','active','rejected','reserved','sold','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type customs_status as enum ('customs_paid','ncp','other','unknown'); exception when duplicate_object then null; end $$;
do $$ begin create type registration_status as enum ('registered','unregistered','unknown'); exception when duplicate_object then null; end $$;
do $$ begin create type selling_mode as enum ('standard','managed'); exception when duplicate_object then null; end $$;
do $$ begin create type inquiry_status as enum ('new','buyer_contacted','seller_contacted','viewing_arranged','negotiation','deal_confirmed','completed','unsuccessful'); exception when duplicate_object then null; end $$;
do $$ begin create type brokerage_type as enum ('fixed','percentage','tiered','custom','zero'); exception when duplicate_object then null; end $$;
do $$ begin create type deal_status as enum ('requested','agreed','listed','negotiating','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type report_status as enum ('open','reviewing','resolved','dismissed'); exception when duplicate_object then null; end $$;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- profiles (users). password_hash is bcrypt; never selected into pages.
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  full_name text,
  phone text,
  district text,
  role user_role not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_email_lower_idx on profiles (lower(email));
drop trigger if exists profiles_updated on profiles;
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions (user_id);

create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists login_attempts (
  id bigserial primary key,
  email text not null,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on login_attempts (lower(email), created_at desc);

create sequence if not exists vehicle_ref_seq start 1001;

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('GBW-' || nextval('vehicle_ref_seq')),
  slug text not null unique,
  seller_id uuid not null references profiles (id) on delete cascade,
  brand text not null,
  model text not null,
  variant text,
  model_year smallint not null check (model_year between 1980 and 2100),
  registration_year smallint check (registration_year between 1980 and 2100),
  engine_cc integer check (engine_cc > 0),
  color text, fuel_type text, transmission text, steering_side text, import_origin text,
  mileage_km integer check (mileage_km >= 0),
  condition text, engine_condition text, suspension_condition text, tyre_condition text,
  accident_history text, repainted_panels text, known_defects text, documents_available text,
  registration_status registration_status not null default 'unknown',
  customs_status customs_status not null default 'unknown',
  district text not null,
  town text,
  description text,
  seller_asking_price bigint not null check (seller_asking_price > 0),
  advertised_price bigint not null check (advertised_price > 0),
  selling_mode selling_mode not null default 'standard',
  status listing_status not null default 'draft',
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  rejection_reason text,
  view_count integer not null default 0,
  docs_reviewed boolean not null default false,
  gbw_inspected boolean not null default false,
  independently_verified boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vehicles_status_idx on vehicles (status);
create index if not exists vehicles_seller_idx on vehicles (seller_id);
create index if not exists vehicles_brand_model_idx on vehicles (brand, model);
create index if not exists vehicles_district_idx on vehicles (district);
create index if not exists vehicles_price_idx on vehicles (advertised_price);
create index if not exists vehicles_year_idx on vehicles (model_year);
create index if not exists vehicles_featured_idx on vehicles (is_featured) where is_featured;
drop trigger if exists vehicles_updated on vehicles;
create trigger vehicles_updated before update on vehicles for each row execute function set_updated_at();

create table if not exists vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  storage_path text not null,
  url text not null,
  angle text,
  alt_text text,
  sort_order smallint not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists vehicle_images_vehicle_idx on vehicle_images (vehicle_id, sort_order);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  buyer_name text not null check (char_length(buyer_name) between 2 and 120),
  buyer_phone text not null check (char_length(buyer_phone) between 7 and 20),
  message text check (char_length(message) <= 2000),
  channel text not null default 'form' check (channel in ('form','whatsapp','call')),
  status inquiry_status not null default 'new',
  assigned_to uuid references profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inquiries_vehicle_idx on inquiries (vehicle_id);
create index if not exists inquiries_status_idx on inquiries (status);
create index if not exists inquiries_assigned_idx on inquiries (assigned_to);
drop trigger if exists inquiries_updated on inquiries;
create trigger inquiries_updated before update on inquiries for each row execute function set_updated_at();

create table if not exists brokerage_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type brokerage_type not null,
  fixed_amount bigint check (fixed_amount >= 0),
  percentage numeric(5,2) check (percentage >= 0 and percentage <= 100),
  tiers jsonb,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brokerage_rule_shape check (
    (type = 'fixed' and fixed_amount is not null) or
    (type = 'percentage' and percentage is not null) or
    (type = 'tiered' and tiers is not null) or
    (type in ('custom','zero'))
  )
);
create unique index if not exists brokerage_one_default on brokerage_rules (is_default) where is_default;
drop trigger if exists brokerage_rules_updated on brokerage_rules;
create trigger brokerage_rules_updated before update on brokerage_rules for each row execute function set_updated_at();

-- Brokerage is always computed here on the server side of the database, never in the browser.
create or replace function calculate_brokerage(p_rule_id uuid, p_seller_amount bigint, p_custom_amount bigint default null)
returns table (brokerage_type brokerage_type, brokerage_amount bigint, advertised_price bigint)
language plpgsql stable as $$
declare r brokerage_rules; fee bigint := 0; tier jsonb;
begin
  if p_seller_amount is null or p_seller_amount <= 0 then raise exception 'Seller amount must be positive'; end if;
  select * into r from brokerage_rules where id = p_rule_id and is_active;
  if not found then raise exception 'Brokerage rule not found or inactive'; end if;
  if r.type = 'fixed' then fee := r.fixed_amount;
  elsif r.type = 'percentage' then fee := round(p_seller_amount * r.percentage / 100.0);
  elsif r.type = 'tiered' then
    for tier in select * from jsonb_array_elements(r.tiers) loop
      if (tier ->> 'up_to') is null or p_seller_amount <= (tier ->> 'up_to')::bigint then
        fee := (tier ->> 'amount')::bigint; exit;
      end if;
    end loop;
  elsif r.type = 'custom' then
    if p_custom_amount is null or p_custom_amount < 0 then raise exception 'Custom brokerage requires a non-negative amount'; end if;
    fee := p_custom_amount;
  else fee := 0;
  end if;
  return query select r.type, fee, p_seller_amount + fee;
end $$;

create table if not exists managed_sales (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles (id) on delete set null,
  seller_id uuid references profiles (id) on delete set null,
  contact_name text not null,
  contact_phone text not null,
  preferred_contact text not null default 'phone' check (preferred_contact in ('phone','whatsapp','email')),
  vehicle_details text not null,
  location text not null,
  description text,
  seller_asking_price bigint not null check (seller_asking_price > 0),
  brokerage_rule_id uuid references brokerage_rules (id),
  brokerage_type brokerage_type,
  brokerage_amount bigint check (brokerage_amount >= 0),
  advertised_price bigint check (advertised_price > 0),
  final_selling_price bigint check (final_selling_price > 0),
  seller_agreed boolean not null default false,
  seller_agreed_at timestamptz,
  deal_status deal_status not null default 'requested',
  assigned_to uuid references profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists managed_sales_status_idx on managed_sales (deal_status);
create index if not exists managed_sales_seller_idx on managed_sales (seller_id);
drop trigger if exists managed_sales_updated on managed_sales;
create trigger managed_sales_updated before update on managed_sales for each row execute function set_updated_at();

-- A deal cannot progress past 'agreed' without the seller's explicit agreement (kept in the DB as a backstop).
create or replace function guard_managed_sale() returns trigger language plpgsql as $$
begin
  if new.deal_status in ('listed','negotiating','completed') and not new.seller_agreed then
    raise exception 'Seller has not agreed to the brokerage amount and advertised price';
  end if;
  if new.deal_status = 'completed' and new.final_selling_price is null then
    raise exception 'final_selling_price is required to complete a deal';
  end if;
  return new;
end $$;
drop trigger if exists managed_sales_guard on managed_sales;
create trigger managed_sales_guard before update on managed_sales for each row execute function guard_managed_sale();

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles (id) on delete set null,
  managed_sale_id uuid references managed_sales (id) on delete set null,
  inquiry_id uuid references inquiries (id) on delete set null,
  seller_amount bigint not null check (seller_amount >= 0),
  brokerage_amount bigint not null default 0 check (brokerage_amount >= 0),
  final_selling_price bigint not null check (final_selling_price > 0),
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  completed_at timestamptz,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint completed_has_date check (status <> 'completed' or completed_at is not null)
);
create index if not exists transactions_status_idx on transactions (status);
drop trigger if exists transactions_updated on transactions;
create trigger transactions_updated before update on transactions for each row execute function set_updated_at();

create table if not exists favorites (
  user_id uuid not null references profiles (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, is_read);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  reporter_id uuid references profiles (id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 120),
  details text check (char_length(details) <= 2000),
  status report_status not null default 'open',
  resolved_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on reports (status);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on activity_logs (created_at desc);

-- Public read model: only safe columns of public listings (no seller id, no private asking price).
create or replace view public_vehicles as
select id, reference, slug, brand, model, variant, model_year, registration_year,
  engine_cc, color, fuel_type, transmission, steering_side, import_origin,
  mileage_km, condition, engine_condition, suspension_condition, tyre_condition,
  accident_history, repainted_panels, known_defects, documents_available,
  registration_status, customs_status, district, town, description,
  advertised_price, selling_mode, status, is_featured, is_demo,
  docs_reviewed, gbw_inspected, independently_verified, view_count, published_at, created_at
from vehicles where status in ('active','reserved','sold');

insert into brokerage_rules (name, type, fixed_amount, is_default)
select 'Standard fixed fee (edit in admin)', 'fixed', 50000, true
where not exists (select 1 from brokerage_rules);
