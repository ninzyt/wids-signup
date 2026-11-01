begin;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '',
  starts_at timestamptz not null,
  location text not null check (char_length(btrim(location)) between 1 and 240)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slots integer not null check (slots between 1 and 1000),
  -- Maintained only by the signup triggers. An atomic increment serializes
  -- competing inserts, including two people claiming the final slot.
  filled_slots integer not null default 0,
  constraint roles_capacity check (filled_slots between 0 and slots)
);
create index roles_event_id_idx on public.roles(event_id);

create table public.signups (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  name_key text generated always as (lower(btrim(regexp_replace(name, '[[:space:]]+', ' ', 'g')))) stored,
  created_at timestamptz not null default now(),
  constraint signups_role_name_unique unique (role_id, name_key)
);

create function public.guard_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then
    update public.roles set filled_slots = filled_slots - 1 where id = OLD.role_id;
    return OLD;
  end if;

  NEW.name := btrim(regexp_replace(NEW.name, '[[:space:]]+', ' ', 'g'));
  if NEW.name is null or char_length(NEW.name) not between 1 and 80 then
    raise exception using errcode = '23514', message = 'Enter a name between 1 and 80 characters.';
  end if;

  if TG_OP = 'UPDATE' then
    if NEW.role_id is distinct from OLD.role_id then
      raise exception using errcode = '23514', message = 'Delete and recreate a signup to move it to another role.';
    end if;
    return NEW;
  end if;

  -- This conditional UPDATE is atomic, including under simultaneous requests.
  -- A failed duplicate constraint rolls this increment back in the same transaction.
  update public.roles set filled_slots = filled_slots + 1
    where id = NEW.role_id and filled_slots < slots;
  if not found then
    raise exception using errcode = '23514', message = 'This role is full or no longer available.';
  end if;
  return NEW;
end;
$$;
revoke all on function public.guard_signup() from public, anon, authenticated;
create trigger signups_guard before insert or update or delete on public.signups
  for each row execute function public.guard_signup();

alter table public.events enable row level security;
alter table public.roles enable row level security;
alter table public.signups enable row level security;

-- Name-only prototype: public reads and signup creation, no browser administration.
revoke all on public.events, public.roles, public.signups from anon, authenticated;
grant select on public.events, public.roles, public.signups to anon, authenticated;
grant insert (role_id, name) on public.signups to anon, authenticated;
create policy events_read on public.events for select to anon, authenticated using (true);
create policy roles_read on public.roles for select to anon, authenticated using (true);
create policy signups_read on public.signups for select to anon, authenticated using (true);
create policy signups_create on public.signups for insert to anon, authenticated with check (true);

commit;
