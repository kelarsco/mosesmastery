-- ============ AI chat assistant: rate limiting (used by the `chat` Edge Function) ============
create table if not exists public.chat_usage (
  day date not null default current_date,
  key text not null,
  n int not null default 0,
  primary key (day, key)
);
alter table public.chat_usage enable row level security;   -- no policies: only the service role can touch it
create or replace function public.chat_hit(p_ip text, p_ip_limit int, p_day_limit int) returns text
language plpgsql security definer set search_path = public as $$
declare a int; b int;
begin
  delete from public.chat_usage where day < current_date - 3;
  insert into public.chat_usage(day, key, n) values (current_date, 'ip:' || left(p_ip, 40), 1)
    on conflict (day, key) do update set n = public.chat_usage.n + 1 returning n into a;
  if a > p_ip_limit then return 'ip'; end if;
  insert into public.chat_usage(day, key, n) values (current_date, 'all', 1)
    on conflict (day, key) do update set n = public.chat_usage.n + 1 returning n into b;
  if b > p_day_limit then return 'day'; end if;
  return 'ok';
end $$;
revoke all on function public.chat_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.chat_hit(text, int, int) to service_role;
