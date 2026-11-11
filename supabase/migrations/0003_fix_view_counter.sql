-- GB Wheels: fix view counter being treated as a seller edit.
-- Before this, a signed-in visitor viewing an ACTIVE listing flipped it back to 'pending'
-- (and the increment was discarded) because guard_vehicle_write saw a non-staff UPDATE.

create or replace function public.guard_vehicle_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  staff boolean := public.has_role(array['super_admin','listing_manager']::public.user_role[]);
begin
  if auth.uid() is null or staff then
    return new; -- service role / server-side jobs / authorised admins
  end if;

  -- The view counter (security definer, below) sets this flag for its own statement only.
  -- Without it, any visitor viewing an active listing would be treated as an owner edit.
  if current_setting('gbw.view_bump', true) = 'on' then
    return new;
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

create or replace function public.increment_vehicle_views(p_vehicle uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('gbw.view_bump', 'on', true);   -- transaction-local
  update public.vehicles set view_count = view_count + 1
  where id = p_vehicle and status in ('active','reserved','sold');
  perform set_config('gbw.view_bump', 'off', true);
end $$;
grant execute on function public.increment_vehicle_views(uuid) to anon, authenticated;
