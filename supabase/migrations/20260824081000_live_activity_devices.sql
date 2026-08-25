create table if not exists public.live_activity_devices (
  user_id uuid not null references auth.users (id) on delete cascade,
  installation_id text not null,
  push_to_start_token text not null,
  locale text not null default 'en',
  updated_at timestamptz not null default now(),
  primary key (user_id, installation_id)
);

create table if not exists public.live_activity_instances (
  user_id uuid not null references auth.users (id) on delete cascade,
  installation_id text not null,
  child_id uuid not null references public.children (id) on delete cascade,
  track text not null check (track in ('session', 'feeding')),
  activity_id text not null,
  update_token text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, installation_id, child_id, track),
  foreign key (user_id, installation_id)
    references public.live_activity_devices (user_id, installation_id) on delete cascade
);

alter table public.live_activity_devices enable row level security;
alter table public.live_activity_instances enable row level security;

drop policy if exists live_activity_devices_own on public.live_activity_devices;
create policy live_activity_devices_own on public.live_activity_devices
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists live_activity_instances_own on public.live_activity_instances;
create policy live_activity_instances_own on public.live_activity_instances
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.is_child_member(child_id)
    and exists (
      select 1 from public.live_activity_devices d
      where d.user_id = auth.uid()
        and d.installation_id = live_activity_instances.installation_id
    )
  );
