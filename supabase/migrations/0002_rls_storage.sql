-- GB Wheels: Row Level Security, public view, storage

alter table public.profiles        enable row level security;
alter table public.vehicles        enable row level security;
alter table public.vehicle_images  enable row level security;
alter table public.inquiries       enable row level security;
alter table public.brokerage_rules enable row level security;
alter table public.managed_sales   enable row level security;
alter table public.transactions    enable row level security;
alter table public.favorites       enable row level security;
alter table public.notifications   enable row level security;
alter table public.reports         enable row level security;
alter table public.activity_logs   enable row level security;

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies don't recurse into RLS)
-- ---------------------------------------------------------------------------
create or replace function public.owns_vehicle(p_vehicle uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vehicles where id = p_vehicle and seller_id = auth.uid())
$$;

create or replace function public.vehicle_is_public(p_vehicle uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.vehicles where id = p_vehicle and status in ('active','reserved','sold'))
$$;

-- ---------------------------------------------------------------------------
-- Public read model.
-- Anonymous users never read public.vehicles directly: that table holds the seller's
-- private asking price (which would reveal the brokerage on managed sales) and seller_id.
-- This view runs with owner rights and exposes only safe columns of public listings.
-- ---------------------------------------------------------------------------
create or replace view public.public_vehicles as
select
  id, reference, slug, brand, model, variant, model_year, registration_year,
  engine_cc, color, fuel_type, transmission, steering_side, import_origin,
  mileage_km, condition, engine_condition, suspension_condition, tyre_condition,
  accident_history, repainted_panels, known_defects, documents_available,
  registration_status, customs_status, district, town, description,
  advertised_price, selling_mode, status, is_featured, is_demo,
  docs_reviewed, gbw_inspected, independently_verified,
  view_count, published_at, created_at
from public.vehicles
where status in ('active', 'reserved', 'sold');

grant select on public.public_vehicles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles: staff read all" on public.profiles
  for select to authenticated using (public.is_staff());
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid() and role = 'user');
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: super admin update" on public.profiles
  for update to authenticated
  using (public.has_role(array['super_admin']::public.user_role[]))
  with check (public.has_role(array['super_admin']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- vehicles (writes by sellers are further constrained by guard_vehicle_write)
-- ---------------------------------------------------------------------------
create policy "vehicles: owner or staff read" on public.vehicles
  for select to authenticated using (seller_id = auth.uid() or public.is_staff());
create policy "vehicles: seller insert own" on public.vehicles
  for insert to authenticated with check (seller_id = auth.uid());
create policy "vehicles: owner update" on public.vehicles
  for update to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "vehicles: managers update" on public.vehicles
  for update to authenticated
  using (public.has_role(array['super_admin','listing_manager']::public.user_role[]))
  with check (public.has_role(array['super_admin','listing_manager']::public.user_role[]));
create policy "vehicles: owner delete" on public.vehicles
  for delete to authenticated using (seller_id = auth.uid());
create policy "vehicles: managers delete" on public.vehicles
  for delete to authenticated
  using (public.has_role(array['super_admin','listing_manager']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- vehicle_images
-- ---------------------------------------------------------------------------
create policy "images: public read for public vehicles" on public.vehicle_images
  for select to anon, authenticated using (public.vehicle_is_public(vehicle_id));
create policy "images: owner read" on public.vehicle_images
  for select to authenticated using (public.owns_vehicle(vehicle_id));
create policy "images: staff read" on public.vehicle_images
  for select to authenticated using (public.is_staff());
create policy "images: owner write" on public.vehicle_images
  for all to authenticated
  using (public.owns_vehicle(vehicle_id)) with check (public.owns_vehicle(vehicle_id));
create policy "images: staff write" on public.vehicle_images
  for all to authenticated
  using (public.has_role(array['super_admin','listing_manager','photographer']::public.user_role[]))
  with check (public.has_role(array['super_admin','listing_manager','photographer']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- inquiries: buyers can create; only staff (and the buyer) can read.
-- Sellers see a limited summary through get_my_vehicle_inquiries() (no buyer phone).
-- ---------------------------------------------------------------------------
create policy "inquiries: create for public vehicles" on public.inquiries
  for insert to anon, authenticated
  with check (
    public.vehicle_is_public(vehicle_id)
    and status = 'new'
    and assigned_to is null
    and notes is null
    and (user_id is null or user_id = auth.uid())
  );
create policy "inquiries: buyer reads own" on public.inquiries
  for select to authenticated using (user_id = auth.uid());
create policy "inquiries: staff read" on public.inquiries
  for select to authenticated
  using (public.has_role(array['super_admin','listing_manager','sales_agent']::public.user_role[]));
create policy "inquiries: staff update" on public.inquiries
  for update to authenticated
  using (public.has_role(array['super_admin','listing_manager','sales_agent']::public.user_role[]))
  with check (public.has_role(array['super_admin','listing_manager','sales_agent']::public.user_role[]));
create policy "inquiries: super admin delete" on public.inquiries
  for delete to authenticated using (public.has_role(array['super_admin']::public.user_role[]));

create or replace function public.get_my_vehicle_inquiries()
returns table (id uuid, vehicle_id uuid, buyer_name text, message text, status public.inquiry_status, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, i.vehicle_id, i.buyer_name, i.message, i.status, i.created_at
  from public.inquiries i
  join public.vehicles v on v.id = i.vehicle_id
  where v.seller_id = auth.uid()
  order by i.created_at desc
$$;
revoke all on function public.get_my_vehicle_inquiries() from public, anon;
grant execute on function public.get_my_vehicle_inquiries() to authenticated;

-- ---------------------------------------------------------------------------
-- brokerage_rules: staff read, super admin manage
-- ---------------------------------------------------------------------------
create policy "brokerage: staff read" on public.brokerage_rules
  for select to authenticated using (public.is_staff());
create policy "brokerage: super admin manage" on public.brokerage_rules
  for all to authenticated
  using (public.has_role(array['super_admin']::public.user_role[]))
  with check (public.has_role(array['super_admin']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- managed_sales
-- ---------------------------------------------------------------------------
create policy "managed: anyone can request" on public.managed_sales
  for insert to anon, authenticated
  with check (
    deal_status = 'requested'
    and seller_agreed = false
    and brokerage_rule_id is null and brokerage_type is null and brokerage_amount is null
    and advertised_price is null and final_selling_price is null
    and assigned_to is null and notes is null
    and (seller_id is null or seller_id = auth.uid())
  );
create policy "managed: seller reads own" on public.managed_sales
  for select to authenticated using (seller_id = auth.uid());
create policy "managed: staff read" on public.managed_sales
  for select to authenticated
  using (public.has_role(array['super_admin','listing_manager','sales_agent']::public.user_role[]));
create policy "managed: staff update" on public.managed_sales
  for update to authenticated
  using (public.has_role(array['super_admin','listing_manager','sales_agent']::public.user_role[]))
  with check (public.has_role(array['super_admin','listing_manager','sales_agent']::public.user_role[]));

-- Pricing is calculated by the database from a brokerage rule, never trusted from the client.
create or replace function public.set_managed_sale_pricing(
  p_managed_sale uuid, p_rule uuid, p_custom_amount bigint default null
) returns public.managed_sales
language plpgsql security definer set search_path = public as $$
declare
  ms public.managed_sales;
  calc record;
begin
  if not public.has_role(array['super_admin','listing_manager','sales_agent']::public.user_role[]) then
    raise exception 'Not authorised';
  end if;

  select * into ms from public.managed_sales where id = p_managed_sale for update;
  if not found then raise exception 'Managed sale not found'; end if;
  if ms.deal_status in ('completed', 'cancelled') then
    raise exception 'Deal is already %', ms.deal_status;
  end if;

  select * into calc from public.calculate_brokerage(p_rule, ms.seller_asking_price, p_custom_amount);

  update public.managed_sales set
    brokerage_rule_id = p_rule,
    brokerage_type    = calc.brokerage_type,
    brokerage_amount  = calc.brokerage_amount,
    advertised_price  = calc.advertised_price,
    seller_agreed     = false,          -- seller must (re)agree to any new figures
    seller_agreed_at  = null,
    deal_status       = 'requested'
  where id = p_managed_sale
  returning * into ms;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'managed_sale.pricing_set', 'managed_sale', ms.id,
          jsonb_build_object('brokerage', ms.brokerage_amount, 'advertised', ms.advertised_price));
  return ms;
end $$;
revoke all on function public.set_managed_sale_pricing(uuid, uuid, bigint) from public, anon;
grant execute on function public.set_managed_sale_pricing(uuid, uuid, bigint) to authenticated;

-- The seller explicitly agrees to the brokerage amount and advertised price.
create or replace function public.agree_to_managed_sale(p_managed_sale uuid)
returns public.managed_sales
language plpgsql security definer set search_path = public as $$
declare ms public.managed_sales;
begin
  update public.managed_sales set
    seller_agreed = true, seller_agreed_at = now(), deal_status = 'agreed'
  where id = p_managed_sale
    and seller_id = auth.uid()
    and advertised_price is not null
    and brokerage_amount is not null
    and deal_status = 'requested'
  returning * into ms;
  if not found then
    raise exception 'Nothing to agree to: pricing not set yet, already agreed, or not your request';
  end if;
  return ms;
end $$;
revoke all on function public.agree_to_managed_sale(uuid) from public, anon;
grant execute on function public.agree_to_managed_sale(uuid) to authenticated;

-- A deal cannot progress past 'agreed' without the seller's explicit agreement.
create or replace function public.guard_managed_sale()
returns trigger language plpgsql as $$
begin
  if new.deal_status in ('listed', 'negotiating', 'completed') and not new.seller_agreed then
    raise exception 'Seller has not agreed to the brokerage amount and advertised price';
  end if;
  if new.deal_status = 'completed' and new.final_selling_price is null then
    raise exception 'final_selling_price is required to complete a deal';
  end if;
  return new;
end $$;
create trigger managed_sales_guard before update on public.managed_sales
  for each row execute function public.guard_managed_sale();

-- ---------------------------------------------------------------------------
-- transactions: sales agents and admins only. Revenue = status 'completed'.
-- ---------------------------------------------------------------------------
create policy "transactions: staff read" on public.transactions
  for select to authenticated
  using (public.has_role(array['super_admin','listing_manager','sales_agent']::public.user_role[]));
create policy "transactions: staff write" on public.transactions
  for all to authenticated
  using (public.has_role(array['super_admin','sales_agent']::public.user_role[]))
  with check (public.has_role(array['super_admin','sales_agent']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- favorites / notifications / reports / activity_logs
-- ---------------------------------------------------------------------------
create policy "favorites: own" on public.favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notifications: own read" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications: own update" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications: staff create" on public.notifications
  for insert to authenticated with check (public.is_staff());

create policy "reports: create for public vehicles" on public.reports
  for insert to anon, authenticated
  with check (
    public.vehicle_is_public(vehicle_id)
    and status = 'open' and resolved_by is null
    and (reporter_id is null or reporter_id = auth.uid())
  );
create policy "reports: managers read" on public.reports
  for select to authenticated
  using (public.has_role(array['super_admin','listing_manager']::public.user_role[]));
create policy "reports: managers update" on public.reports
  for update to authenticated
  using (public.has_role(array['super_admin','listing_manager']::public.user_role[]))
  with check (public.has_role(array['super_admin','listing_manager']::public.user_role[]));

create policy "activity: super admin read" on public.activity_logs
  for select to authenticated using (public.has_role(array['super_admin']::public.user_role[]));
create policy "activity: staff insert" on public.activity_logs
  for insert to authenticated with check (public.is_staff() and actor_id = auth.uid());

-- View counter: callable by anyone, touches nothing else.
create or replace function public.increment_vehicle_views(p_vehicle uuid)
returns void language sql security definer set search_path = public as $$
  update public.vehicles set view_count = view_count + 1
  where id = p_vehicle and status in ('active','reserved','sold')
$$;
grant execute on function public.increment_vehicle_views(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for vehicle photos, 5 MB limit, images only.
-- Files must live under "<auth user id>/..." so users can only touch their own.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-images', 'vehicle-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "vehicle-images: public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'vehicle-images');
create policy "vehicle-images: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vehicle-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicle-images: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'vehicle-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicle-images: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vehicle-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicle-images: staff manage" on storage.objects
  for all to authenticated
  using (bucket_id = 'vehicle-images' and public.has_role(array['super_admin','listing_manager','photographer']::public.user_role[]))
  with check (bucket_id = 'vehicle-images' and public.has_role(array['super_admin','listing_manager','photographer']::public.user_role[]));
