-- BabyTimer sharing schema. Run in Supabase SQL editor.
-- Auth setup:
--   • Email provider (enabled by default). For the 6-digit code flow, edit the
--     "Magic Link" email template so it contains {{ .Token }}.
--   • Google provider: Authentication → Providers → Google (needs OAuth client
--     ID/secret from Google Cloud Console). Add the app redirect URL
--     (babytimer://auth-callback) to Authentication → URL Configuration →
--     Redirect URLs.

-- ── Tables ──────────────────────────────────────────────────────────────

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gradient_key text not null,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.child_members (
  child_id uuid not null references public.children (id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (child_id, user_id)
);

create table if not exists public.sessions (
  child_id uuid not null references public.children (id) on delete cascade,
  id text not null,
  kind text not null,
  start_ms bigint not null,
  end_ms bigint not null,
  milk_ml integer,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (child_id, id)
);

create index if not exists sessions_child_updated
  on public.sessions (child_id, updated_at);

-- Currently running timers, one row per (child, track). Started = upsert,
-- stopped = delete; the completed record then arrives through sessions.
create table if not exists public.live_sessions (
  child_id uuid not null references public.children (id) on delete cascade,
  track text not null check (track in ('session', 'feeding')),
  kind text not null,
  started_at_ms bigint not null,
  started_by uuid not null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (child_id, track)
);

create table if not exists public.invites (
  code text primary key,
  child_id uuid not null references public.children (id) on delete cascade,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

-- Server-authoritative updated_at so pull cursors can trust it.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists sessions_touch on public.sessions;
create trigger sessions_touch
  before insert or update on public.sessions
  for each row execute function public.touch_updated_at();

-- ── Realtime ────────────────────────────────────────────────────────────
-- Stream sessions changes to subscribed clients (RLS still applies: only
-- members of the child receive its events).

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sessions'
  ) then
    alter publication supabase_realtime add table public.sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_sessions'
  ) then
    alter publication supabase_realtime add table public.live_sessions;
  end if;
end $$;

-- ── Membership helper (security definer avoids RLS recursion) ───────────

create or replace function public.is_child_member(cid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from child_members
    where child_id = cid and user_id = auth.uid()
  );
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────

alter table public.children enable row level security;
alter table public.child_members enable row level security;
alter table public.sessions enable row level security;
alter table public.live_sessions enable row level security;
alter table public.invites enable row level security;

drop policy if exists children_select on public.children;
create policy children_select on public.children
  for select using (created_by = auth.uid() or public.is_child_member(id));

drop policy if exists children_insert on public.children;
create policy children_insert on public.children
  for insert with check (created_by = auth.uid());

drop policy if exists children_update on public.children;
create policy children_update on public.children
  for update using (public.is_child_member(id));

drop policy if exists members_select on public.child_members;
create policy members_select on public.child_members
  for select using (user_id = auth.uid());

-- The creator may add themselves; everyone else joins via redeem_invite().
drop policy if exists members_insert on public.child_members;
create policy members_insert on public.child_members
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.children c
      where c.id = child_id and c.created_by = auth.uid()
    )
  );

drop policy if exists sessions_all on public.sessions;
create policy sessions_all on public.sessions
  for all using (public.is_child_member(child_id))
  with check (public.is_child_member(child_id));

drop policy if exists live_sessions_all on public.live_sessions;
create policy live_sessions_all on public.live_sessions
  for all using (public.is_child_member(child_id))
  with check (public.is_child_member(child_id));

drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites
  for select using (public.is_child_member(child_id));

drop policy if exists invites_insert on public.invites;
create policy invites_insert on public.invites
  for insert with check (public.is_child_member(child_id));

-- ── RPC ─────────────────────────────────────────────────────────────────

-- Generates a short invite code for a child (member only).
create or replace function public.create_invite(cid uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code text := '';
  i integer;
begin
  if not public.is_child_member(cid) then
    raise exception 'not a member';
  end if;
  for i in 1..8 loop
    new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  new_code := substr(new_code, 1, 4) || '-' || substr(new_code, 5, 4);
  insert into invites (code, child_id, created_by) values (new_code, cid, auth.uid());
  return new_code;
end $$;

-- Removes the caller from a child; deletes the child (and its sessions,
-- via cascade) when no members remain.
create or replace function public.leave_child(cid uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from child_members where child_id = cid and user_id = auth.uid();
  if not exists (select 1 from child_members where child_id = cid) then
    delete from children where id = cid;
  end if;
end $$;

-- Joins the caller to the invite's child and returns the child profile.
create or replace function public.redeem_invite(invite_code text)
returns table (child_id uuid, name text, gradient_key text)
language plpgsql security definer set search_path = public as $$
declare
  inv record;
begin
  select * into inv from invites
  where code = upper(trim(invite_code)) and expires_at > now();
  if not found then
    raise exception 'invalid or expired code';
  end if;
  insert into child_members (child_id, user_id)
  values (inv.child_id, auth.uid())
  on conflict do nothing;
  return query
    select c.id, c.name, c.gradient_key from children c where c.id = inv.child_id;
end $$;
