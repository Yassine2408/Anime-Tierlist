-- =====================================================
-- RLS POLICIES WITH DROP (Safe to re-run)
-- =====================================================
-- This version drops existing policies before creating new ones

-- Enable RLS
alter table public.tier_lists enable row level security;
alter table public.tier_list_items enable row level security;
alter table public.profiles enable row level security;
alter table public.anime_feedback enable row level security;
alter table public.episode_feedback enable row level security;

-- === Drop existing tier_lists policies ===
drop policy if exists "tier_lists_select_own" on public.tier_lists;
drop policy if exists "tier_lists_modify_own" on public.tier_lists;
drop policy if exists "tier_lists_select_public" on public.tier_lists;

-- === Drop existing tier_list_items policies ===
drop policy if exists "tier_items_select_own" on public.tier_list_items;
drop policy if exists "tier_items_modify_own" on public.tier_list_items;
drop policy if exists "tier_items_select_public" on public.tier_list_items;

-- === Drop existing profiles policies ===
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_modify_own" on public.profiles;

-- === Drop existing anime_feedback policies ===
drop policy if exists "anime_feedback_select_public" on public.anime_feedback;
drop policy if exists "anime_feedback_insert_own" on public.anime_feedback;
drop policy if exists "anime_feedback_modify_own" on public.anime_feedback;
drop policy if exists "anime_feedback_delete_own" on public.anime_feedback;

-- === Drop existing episode_feedback policies ===
drop policy if exists "episode_feedback_select_public" on public.episode_feedback;
drop policy if exists "episode_feedback_insert_own" on public.episode_feedback;
drop policy if exists "episode_feedback_modify_own" on public.episode_feedback;
drop policy if exists "episode_feedback_delete_own" on public.episode_feedback;

-- =====================================================
-- CREATE NEW POLICIES
-- =====================================================

-- === Tier Lists Policies ===
-- Ownership: only the owner (user_id = auth.uid()) can CRUD their tier lists
create policy "tier_lists_select_own" on public.tier_lists
  for select using (auth.uid() = user_id);

create policy "tier_lists_modify_own" on public.tier_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public view: allow select of public tier lists
create policy "tier_lists_select_public" on public.tier_lists
  for select using (is_public = true);

-- === Tier List Items Policies ===
-- Items must belong to lists the user owns
create policy "tier_items_select_own" on public.tier_list_items
  for select using (
    exists (
      select 1 from public.tier_lists tl where tl.id = tier_list_id and tl.user_id = auth.uid()
    )
  );

create policy "tier_items_modify_own" on public.tier_list_items
  for all using (
    exists (
      select 1 from public.tier_lists tl where tl.id = tier_list_id and tl.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tier_lists tl where tl.id = tier_list_id and tl.user_id = auth.uid()
    )
  );

-- Public view: allow reading items of public tier lists
create policy "tier_items_select_public" on public.tier_list_items
  for select using (
    exists (
      select 1 from public.tier_lists tl where tl.id = tier_list_id and tl.is_public = true
    )
  );

-- === User Profiles Policies ===
create policy "profiles_select_public" on public.profiles
  for select using (true);

create policy "profiles_modify_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- === Anime Feedback Policies ===
create policy "anime_feedback_select_public" on public.anime_feedback
  for select using (true);
  
create policy "anime_feedback_insert_own" on public.anime_feedback
  for insert with check (auth.uid() = user_id);
  
create policy "anime_feedback_modify_own" on public.anime_feedback
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  
create policy "anime_feedback_delete_own" on public.anime_feedback
  for delete using (auth.uid() = user_id);

-- === Episode Feedback Policies ===
create policy "episode_feedback_select_public" on public.episode_feedback
  for select using (true);
  
create policy "episode_feedback_insert_own" on public.episode_feedback
  for insert with check (auth.uid() = user_id);
  
create policy "episode_feedback_modify_own" on public.episode_feedback
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  
create policy "episode_feedback_delete_own" on public.episode_feedback
  for delete using (auth.uid() = user_id);
