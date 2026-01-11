-- Add sharing columns to tier_lists
alter table if exists public.tier_lists
  add column if not exists is_public boolean not null default false,
  add column if not exists share_id text;

-- Optional: unique share_id when set
create unique index if not exists tier_lists_share_id_key on public.tier_lists (share_id) where share_id is not null;

-- Ensure updated_at is maintained by trigger (optional, if not set in app)
-- create trigger update_timestamp before update on public.tier_lists
-- for each row execute procedure moddatetime (updated_at);

-- User profiles for display names
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Feedback tables
create table if not exists public.anime_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id integer not null,
  rating integer,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.episode_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id integer not null,
  episode integer not null,
  rating integer,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_anime_feedback_anime_id on public.anime_feedback (anime_id);
create index if not exists idx_anime_feedback_user_id on public.anime_feedback (user_id);
create index if not exists idx_episode_feedback_anime_id_episode on public.episode_feedback (anime_id, episode);
create index if not exists idx_episode_feedback_user_id on public.episode_feedback (user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, created_at, updated_at)
  values (new.id, now(), now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
