create extension if not exists pgcrypto;

create table if not exists public.notes (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  title text,
  content text not null,
  tags text[] not null default '{}',
  entry_date date not null,
  mood_level integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_mood_level_check check (mood_level is null or mood_level between 1 and 5)
);

create index if not exists notes_user_id_idx on public.notes (user_id);
create index if not exists notes_user_id_entry_date_idx on public.notes (user_id, entry_date desc);
create index if not exists notes_user_id_updated_at_idx on public.notes (user_id, updated_at desc);

create table if not exists public.habit_checkins (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  date date not null,
  habit_key text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_checkins_unique_user_date_habit unique (user_id, date, habit_key)
);

create index if not exists habit_checkins_user_id_idx on public.habit_checkins (user_id);
create index if not exists habit_checkins_user_id_date_idx on public.habit_checkins (user_id, date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();

drop trigger if exists habit_checkins_set_updated_at on public.habit_checkins;
create trigger habit_checkins_set_updated_at
before update on public.habit_checkins
for each row
execute function public.set_updated_at();
