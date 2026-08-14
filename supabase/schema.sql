-- BabyTimer sharing schema. Run in Supabase SQL editor.
-- Auth setup — the app signs in with Google and Apple only, no email flow:
--   • Google provider: Authentication → Providers → Google (needs OAuth client
--     ID/secret from Google Cloud Console).
--   • Apple provider: Authentication → Providers → Apple (needs a Services ID,
--     Team ID, Key ID and the .p8 key from Apple Developer).
--   • Add the app redirect URL (babytimer://auth-callback) to Authentication →
--     URL Configuration → Redirect URLs.

-- ── Tables ──────────────────────────────────────────────────────────────

-- trial_ends_at stays null until the user starts the trial from the paywall
-- (start_trial() below). A non-null value therefore means "trial used", no
-- matter whether it is still running or already over.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pro_active boolean not null default false,
  trial_ends_at timestamptz,
  pro_renews_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists pro_active boolean not null default false;
alter table public.profiles add column if not exists trial_ends_at timestamptz;
alter table public.profiles add column if not exists pro_renews_at timestamptz;
-- Stops the automatic trial in projects created while sign-up still granted one.
alter table public.profiles alter column trial_ends_at drop default;

-- Accounts that predate the profiles table get a row without a trial; they can
-- still start one from the paywall.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.create_account_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists auth_user_create_profile on auth.users;
create trigger auth_user_create_profile
  after insert on auth.users
  for each row execute function public.create_account_profile();

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gradient_key text not null,
  birthday_ms bigint,
  pro_enabled boolean not null default false,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

-- For projects created before birthday support.
alter table public.children add column if not exists birthday_ms bigint;
alter table public.children add column if not exists pro_enabled boolean not null default false;

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
  pro_details jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (child_id, id)
);

alter table public.sessions add column if not exists pro_details jsonb;

create index if not exists sessions_child_updated
  on public.sessions (child_id, updated_at);

-- Currently running timers, one row per (child, track). Started = upsert,
-- stopped = delete; the completed record then arrives through sessions.
create table if not exists public.live_sessions (
  child_id uuid not null references public.children (id) on delete cascade,
  track text not null check (track in ('session', 'feeding')),
  kind text not null,
  started_at_ms bigint not null,
  pro_details jsonb,
  started_by uuid not null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (child_id, track)
);

alter table public.live_sessions add column if not exists pro_details jsonb;

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

create or replace function public.has_active_pro()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select
        (
          pro_active
          and (pro_renews_at is null or pro_renews_at > now())
        )
        or coalesce(trial_ends_at > now(), false)
      from profiles
      where id = auth.uid()
    ),
    false
  );
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.child_members enable row level security;
alter table public.sessions enable row level security;
alter table public.live_sessions enable row level security;
alter table public.invites enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists children_select on public.children;
create policy children_select on public.children
  for select using (created_by = auth.uid() or public.is_child_member(id));

drop policy if exists children_insert on public.children;
create policy children_insert on public.children
  for insert with check (created_by = auth.uid() and public.has_active_pro());

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
    and public.has_active_pro()
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

-- Temporary purchase hook. Replace this RPC with verified App Store purchase
-- handling when StoreKit integration is added.
create or replace function public.activate_test_pro()
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  renewal timestamptz := now() + interval '1 month';
begin
  insert into profiles (id, pro_active, pro_renews_at)
  values (auth.uid(), true, renewal)
  on conflict (id) do update
    set pro_active = true,
        pro_renews_at = renewal,
        updated_at = now();
  return renewal;
end $$;

-- Starts the one-off 14-day trial. trial_ends_at is written exactly once per
-- account, so a second call fails whether the trial is running or long over.
create or replace function public.start_trial()
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  ends_at timestamptz := now() + interval '14 days';
  updated timestamptz;
begin
  insert into profiles (id, trial_ends_at)
  values (auth.uid(), ends_at)
  on conflict (id) do update
    set trial_ends_at = ends_at,
        updated_at = now()
    where profiles.trial_ends_at is null
  returning profiles.trial_ends_at into updated;
  if updated is null then
    raise exception 'trial already used';
  end if;
  return updated;
end $$;

-- Generates a short invite code for a child (member only).
create or replace function public.create_invite(cid uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code text := '';
  i integer;
begin
  if not public.has_active_pro() then
    raise exception 'pro subscription required';
  end if;
  if not public.is_child_member(cid) then
    raise exception 'not a member';
  end if;
  update children set pro_enabled = true where id = cid;
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

-- Erases the caller's account: every membership goes, children nobody is left
-- in go with it (their sessions cascade), and finally the auth user itself —
-- which cascades the profile row. Required by App Store guideline 5.1.1(v).
create or replace function public.delete_account()
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  cid uuid;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  for cid in select child_id from child_members where user_id = uid loop
    delete from child_members where child_id = cid and user_id = uid;
    if not exists (select 1 from child_members where child_id = cid) then
      delete from children where id = cid;
    end if;
  end loop;
  -- Safety net for children created without a membership row.
  delete from children c
  where c.created_by = uid
    and not exists (select 1 from child_members m where m.child_id = c.id);
  delete from auth.users where id = uid;
end $$;

-- Joins the caller to the invite's child and returns the child profile.
-- PostgreSQL cannot change the OUT row type with CREATE OR REPLACE, so the
-- pre-birthday version must be removed before recreating it.
drop function if exists public.redeem_invite(text);
create function public.redeem_invite(invite_code text)
returns table (
  child_id uuid,
  name text,
  gradient_key text,
  birthday_ms bigint,
  pro_enabled boolean
)
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
    select c.id, c.name, c.gradient_key, c.birthday_ms, c.pro_enabled
    from children c where c.id = inv.child_id;
end $$;
