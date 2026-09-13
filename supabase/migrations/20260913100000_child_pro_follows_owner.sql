-- A child's Pro follows its owner's subscription. It used to be switched on
-- once, when the owner shared the child, and never off again, so members kept
-- Pro after the owner's plan or trial had ended.

create or replace function public.user_has_active_pro(uid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select
        (pro_active and (pro_renews_at is null or pro_renews_at > now()))
        or coalesce(trial_ends_at > now(), false)
      from profiles
      where id = uid
    ),
    false
  );
$$;

create or replace function public.sync_children_pro(owner uuid default null)
returns void
language sql security definer set search_path = public as $$
  update children c
  set pro_enabled = user_has_active_pro(c.created_by)
  where (owner is null or c.created_by = owner)
    and c.pro_enabled is distinct from user_has_active_pro(c.created_by);
$$;

revoke execute on function public.user_has_active_pro(uuid) from public, anon, authenticated;
revoke execute on function public.sync_children_pro(uuid) from public, anon, authenticated;

-- Subscriptions (RevenueCat webhook) and trials (start_trial) change the profile.
create or replace function public.profiles_sync_children_pro()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform sync_children_pro(new.id);
  return new;
end $$;

drop trigger if exists profiles_sync_children_pro on public.profiles;
create trigger profiles_sync_children_pro
  after insert or update of pro_active, pro_renews_at, trial_ends_at on public.profiles
  for each row execute function public.profiles_sync_children_pro();

-- A plan or trial also ends just by time passing, with no profile change to react to.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('sync-children-pro', '*/15 * * * *', 'select public.sync_children_pro()');

select public.sync_children_pro();
