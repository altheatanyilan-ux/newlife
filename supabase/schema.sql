-- Life Instrument — the cloud copy of the house.
-- Paste this whole file into Supabase → SQL editor → Run. It is safe to run again.
--
-- The app is local-first: the browser keeps its own database and works offline.
-- This is only where a copy lives so every device sees the same life. Each
-- "unit" is one store of the app (tasks, entries, scores, …) or one settings
-- key. A unit is written as a few parts (so no single request is huge) under a
-- generation number, and a head row says which generation is current. Flipping
-- the head is one atomic call, so a half-uploaded unit is never read.
--
-- Everything is private to the signed-in user (row level security).

create table if not exists public.li_heads (
  user_id    uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  unit       text   not null,
  gen        bigint not null,
  nparts     int    not null,
  print      text   not null,
  device     text,
  updated_at timestamptz not null default now(),
  primary key (user_id, unit)
);

create table if not exists public.li_parts (
  user_id uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  unit    text   not null,
  gen     bigint not null,
  part    int    not null,
  data    text   not null,           -- text, not jsonb: jsonb would reorder keys and change the fingerprint
  primary key (user_id, unit, gen, part)
);

create table if not exists public.li_profile (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  enc     boolean not null default false,   -- is the data end-to-end encrypted with a passphrase?
  salt    text,
  verify  text
);

alter table public.li_heads   enable row level security;
alter table public.li_parts   enable row level security;
alter table public.li_profile enable row level security;

drop policy if exists li_heads_own   on public.li_heads;
drop policy if exists li_parts_own   on public.li_parts;
drop policy if exists li_profile_own on public.li_profile;
create policy li_heads_own   on public.li_heads   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy li_parts_own   on public.li_parts   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy li_profile_own on public.li_profile for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Make a new generation of a unit the current one, if nobody else got there first.
-- p_expect is the generation this device last saw (0 = none). Returns false when
-- the head has moved on, and the caller starts again from a fresh read.
create or replace function public.li_commit(
  p_unit text, p_gen bigint, p_expect bigint, p_nparts int, p_print text, p_device text
) returns boolean
language plpgsql
security invoker
as $$
declare cur bigint;
begin
  select gen into cur from public.li_heads where user_id = auth.uid() and unit = p_unit for update;
  if cur is null then
    if p_expect <> 0 then return false; end if;
    begin
      insert into public.li_heads(unit, gen, nparts, print, device) values (p_unit, p_gen, p_nparts, p_print, p_device);
    exception when unique_violation then
      return false;
    end;
  else
    if cur <> p_expect then return false; end if;
    update public.li_heads
       set gen = p_gen, nparts = p_nparts, print = p_print, device = p_device, updated_at = now()
     where user_id = auth.uid() and unit = p_unit;
  end if;
  delete from public.li_parts where user_id = auth.uid() and unit = p_unit and gen <> p_gen;
  return true;
end;
$$;

grant usage on schema public to authenticated;
grant all on public.li_heads, public.li_parts, public.li_profile to authenticated;
grant execute on function public.li_commit(text, bigint, bigint, int, text, text) to authenticated;
