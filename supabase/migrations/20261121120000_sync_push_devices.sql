create table if not exists public.sync_push_devices (
  user_id uuid not null references auth.users (id) on delete cascade,
  installation_id text not null,
  platform text not null check (platform in ('ios')),
  device_token text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, installation_id)
);

create index if not exists sync_push_devices_token on public.sync_push_devices (device_token);

alter table public.sync_push_devices enable row level security;

drop policy if exists sync_push_devices_own on public.sync_push_devices;
create policy sync_push_devices_own on public.sync_push_devices
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.sync_push_devices to authenticated, service_role;
