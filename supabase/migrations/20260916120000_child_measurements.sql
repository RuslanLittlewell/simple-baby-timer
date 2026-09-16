create table if not exists public.child_measurements (
  child_id uuid not null references public.children (id) on delete cascade,
  id text not null,
  measured_on date not null,
  height_cm numeric(7, 2) not null check (height_cm > 0),
  weight_kg numeric(7, 3) not null check (weight_kg > 0),
  updated_at timestamptz not null default now(),
  primary key (child_id, id)
);

create index if not exists child_measurements_child_date
  on public.child_measurements (child_id, measured_on desc, id desc);

drop trigger if exists child_measurements_touch on public.child_measurements;
create trigger child_measurements_touch
  before insert or update on public.child_measurements
  for each row execute function public.touch_updated_at();

alter table public.child_measurements enable row level security;

drop policy if exists child_measurements_select on public.child_measurements;
create policy child_measurements_select on public.child_measurements
  for select using (public.is_child_member(child_id));

drop policy if exists child_measurements_insert on public.child_measurements;
create policy child_measurements_insert on public.child_measurements
  for insert with check (public.is_child_member(child_id));

drop policy if exists child_measurements_update on public.child_measurements;
create policy child_measurements_update on public.child_measurements
  for update
  using (public.is_child_member(child_id))
  with check (public.is_child_member(child_id));

grant select, insert, update on public.child_measurements to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'child_measurements'
  ) then
    alter publication supabase_realtime add table public.child_measurements;
  end if;
end $$;

