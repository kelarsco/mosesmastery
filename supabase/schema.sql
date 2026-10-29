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

-- =====================================================================
-- 4) PROJECTS MANAGER (run this part once; safe to re-run)
--    Lets you add, edit, hide, reorder and delete (with undo) the items in "All projects".
-- =====================================================================
create table if not exists public.portfolio_items (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  kind        text not null check (kind in ('store','video','shot')),
  title       text not null default '' check (char_length(title) <= 120),
  subtitle    text not null default '' check (char_length(subtitle) <= 160),
  tag         text not null default '' check (char_length(tag) <= 60),
  url         text not null default '' check (url = '' or url ~ '^https?://'),
  media_url   text not null default '' check (media_url ~ '^(https://|asset/)'),
  poster_url  text not null default '' check (poster_url = '' or poster_url ~ '^(https://|asset/)'),
  alt         text not null default '' check (char_length(alt) <= 200),
  sort        integer not null default 0,
  visible     boolean not null default true,
  deleted_at  timestamptz
);
create index if not exists portfolio_sort_idx on public.portfolio_items (sort);
alter table public.portfolio_items enable row level security;

drop policy if exists "public reads visible projects" on public.portfolio_items;
create policy "public reads visible projects" on public.portfolio_items for select to anon, authenticated using (visible and deleted_at is null);
drop policy if exists "admins read projects" on public.portfolio_items;
create policy "admins read projects"   on public.portfolio_items for select to authenticated using (public.is_admin());
drop policy if exists "admins insert projects" on public.portfolio_items;
create policy "admins insert projects" on public.portfolio_items for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update projects" on public.portfolio_items;
create policy "admins update projects" on public.portfolio_items for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- no DELETE policy on purpose: delete = soft delete, so it can be undone.

-- Tells the website whether you manage projects here (so hiding everything really hides everything).
create or replace function public.portfolio_managed() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.portfolio_items where deleted_at is null)
$$;
grant execute on function public.portfolio_managed() to anon, authenticated;

-- Public storage bucket for images/videos you upload (50 MB max per file).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 52428800, array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "admins upload portfolio files" on storage.objects;
create policy "admins upload portfolio files" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());

-- 5) Site controls (Dashboard > Controls): announcement bar, maintenance notice, tracking switch, hero video switch
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id, data) values (1, '{}'::jsonb) on conflict do nothing;
alter table public.site_settings enable row level security;
drop policy if exists "anyone reads settings" on public.site_settings;
create policy "anyone reads settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "admins update settings" on public.site_settings;
create policy "admins update settings" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
notify pgrst, 'reload schema';

-- 6. Leads: every contact-form and calculator request is also saved here, so none can be lost if email fails.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'contact' check (source in ('contact','calculator')),
  name text check (char_length(name) <= 120),
  email text check (char_length(email) <= 200),
  link text check (char_length(link) <= 300),
  services text check (char_length(services) <= 400),
  stage text check (char_length(stage) <= 120),
  budget text check (char_length(budget) <= 80),
  timeline text check (char_length(timeline) <= 80),
  how_heard text check (char_length(how_heard) <= 80),
  message text check (char_length(message) <= 3000),
  numbers jsonb,
  status text not null default 'new' check (status in ('new','contacted','won','lost')),
  notes text check (char_length(notes) <= 2000)
);
alter table public.leads enable row level security;
drop policy if exists "visitors send leads" on public.leads;
create policy "visitors send leads" on public.leads for insert to anon, authenticated with check (status = 'new' and notes is null);
drop policy if exists "admins read leads" on public.leads;
create policy "admins read leads" on public.leads for select to authenticated using (public.is_admin());
drop policy if exists "admins update leads" on public.leads;
create policy "admins update leads" on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant insert on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;
notify pgrst, 'reload schema';
