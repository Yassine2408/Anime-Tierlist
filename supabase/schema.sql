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
  episode integer not null check (episode > 0 AND episode <= 9999),
  rating integer,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_anime_feedback_anime_id on public.anime_feedback (anime_id);
create index if not exists idx_anime_feedback_user_id on public.anime_feedback (user_id);
create index if not exists idx_episode_feedback_anime_id_episode on public.episode_feedback (anime_id, episode);
create index if not exists idx_episode_feedback_user_id on public.episode_feedback (user_id);

-- Anime metadata cache for episode counts (from Jikan API)
create table if not exists public.anime_metadata (
  anime_id integer primary key,
  episodes integer,
  status text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_anime_metadata_anime_id on public.anime_metadata (anime_id);
create index if not exists idx_anime_metadata_last_updated on public.anime_metadata (last_updated);

-- Enable RLS on anime_metadata
alter table if exists public.anime_metadata enable row level security;

-- RLS policies for anime_metadata
create policy if not exists "anime_metadata_select_public" on public.anime_metadata
  for select
  using (true);

create policy if not exists "anime_metadata_insert_authenticated" on public.anime_metadata
  for insert
  with check (auth.role() = 'authenticated');

create policy if not exists "anime_metadata_update_authenticated" on public.anime_metadata
  for update
  using (auth.role() = 'authenticated');

-- Function to validate episode numbers against anime metadata
create or replace function public.validate_episode_number(
  p_anime_id integer,
  p_episode integer
) returns boolean
language plpgsql
stable
as $$
declare
  v_episodes integer;
begin
  -- Basic validation: episode must be positive and within reasonable range
  -- This matches the existing check constraint
  if p_episode <= 0 or p_episode > 9999 then
    return false;
  end if;

  -- Try to get episode count from metadata cache
  select episodes into v_episodes
  from public.anime_metadata
  where anime_id = p_anime_id;

  -- If metadata exists and has a known positive episode count, validate against it
  if v_episodes is not null and v_episodes > 0 then
    if p_episode > v_episodes then
      return false; -- Episode exceeds known episode count
    end if;
  end if;

  -- If metadata doesn't exist or episodes is null/0, allow the submission
  -- This ensures backward compatibility and allows ratings for ongoing anime
  -- The basic constraint (episode <= 9999) still provides protection
  return true;
end;
$$;

-- Function to upsert anime metadata
create or replace function public.upsert_anime_metadata(
  p_anime_id integer,
  p_episodes integer,
  p_status text default null
) returns void
language plpgsql
as $$
begin
  insert into public.anime_metadata (anime_id, episodes, status, last_updated, created_at)
  values (p_anime_id, p_episodes, p_status, now(), now())
  on conflict (anime_id) 
  do update set
    episodes = excluded.episodes,
    status = coalesce(excluded.status, anime_metadata.status),
    last_updated = now();
end;
$$;

-- Function for trigger to validate episodes against metadata
create or replace function public.check_episode_against_metadata()
returns trigger
language plpgsql
as $$
declare
  v_episodes integer;
begin
  -- Use the validation function
  if not public.validate_episode_number(new.anime_id, new.episode) then
    -- Get episode count for better error message
    select episodes into v_episodes
    from public.anime_metadata
    where anime_id = new.anime_id;
    
    if v_episodes is not null and v_episodes > 0 and new.episode > v_episodes then
      raise exception 'Episode % exceeds the known episode count of % for this anime', new.episode, v_episodes;
    else
      -- Fall back to generic error if metadata validation fails for other reasons
      raise exception 'Invalid episode number: %', new.episode;
    end if;
  end if;
  
  return new;
end;
$$;

-- Trigger to validate episodes on insert/update
drop trigger if exists episode_feedback_validate_episode on public.episode_feedback;
create trigger episode_feedback_validate_episode
  before insert or update on public.episode_feedback
  for each row
  execute function public.check_episode_against_metadata();

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
