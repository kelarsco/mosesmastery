-- Moses Mastery analytics + admin. Run once in Supabase: SQL Editor > New query > paste > Run.
-- 1) Tables
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  vid         text not null check (char_length(vid)  <= 64),
  sid         text not null check (char_length(sid)  <= 64),
  type        text not null check (char_length(type) <= 40),
  path        text not null check (char_length(path) <= 300),
  title       text check (char_length(title) <= 200),
  ref         text check (char_length(ref)   <= 120),
  device      text check (char_length(device) <= 20),
  browser     text check (char_length(browser) <= 30),
  os          text check (char_length(os) <= 30),
  w           int,
  tz          text check (char_length(tz) <= 60),
  utm_source  text check (char_length(utm_source)   <= 80),
  utm_medium  text check (char_length(utm_medium)   <= 80),
  utm_campaign text check (char_length(utm_campaign) <= 80),
  meta        jsonb not null default '{}'::jsonb,
  deleted_at  timestamptz
);
create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_type_idx    on public.events (type);
create index if not exists events_path_idx    on public.events (path);

create table if not exists public.admins (email text primary key);
create table if not exists public.admin_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  admin text, action text, detail jsonb
);

-- 2) Who is an admin (CHANGE THE EMAIL if needed; add more rows for more admins)
insert into public.admins (email) values ('mosesonwen@gmail.com') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'))
$$;

-- 3) Row-level security: visitors can only ADD events. Only admins can read, hide/restore or log.
alter table public.events    enable row level security;
alter table public.admins    enable row level security;
alter table public.admin_log enable row level security;

drop policy if exists "visitors insert events" on public.events;
create policy "visitors insert events" on public.events for insert to anon, authenticated with check (deleted_at is null);
drop policy if exists "admins read events" on public.events;
create policy "admins read events"  on public.events for select to authenticated using (public.is_admin());
drop policy if exists "admins update events" on public.events;
create policy "admins update events" on public.events for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins for select to authenticated using (public.is_admin());

drop policy if exists "admins read log" on public.admin_log;
create policy "admins read log"  on public.admin_log for select to authenticated using (public.is_admin());
drop policy if exists "admins write log" on public.admin_log;
create policy "admins write log" on public.admin_log for insert to authenticated with check (public.is_admin());
-- No DELETE policies exist on purpose: "delete" in the dashboard is a soft delete (deleted_at) that can be undone.
