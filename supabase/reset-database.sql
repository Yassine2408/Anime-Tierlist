-- =====================================================
-- DATABASE RESET SCRIPT FOR OFFICIAL LAUNCH
-- =====================================================
-- WARNING: This will delete ALL user data!
-- Only run this when preparing for official launch
-- =====================================================

-- Delete all tier list items (must be first due to foreign keys)
DELETE FROM public.tier_list_items;

-- Delete all tier lists
DELETE FROM public.tier_lists;

-- Delete all feedback
DELETE FROM public.anime_feedback;
DELETE FROM public.episode_feedback;

-- Delete all profiles (this will cascade delete associated data)
DELETE FROM public.profiles;

-- Optional: If you want to completely remove user accounts as well
-- (Uncomment the line below if you want to delete auth users too)
-- DELETE FROM auth.users;

-- Verify all tables are empty
SELECT 'tier_lists' as table_name, COUNT(*) as row_count FROM public.tier_lists
UNION ALL
SELECT 'tier_list_items', COUNT(*) FROM public.tier_list_items
UNION ALL
SELECT 'anime_feedback', COUNT(*) FROM public.anime_feedback
UNION ALL
SELECT 'episode_feedback', COUNT(*) FROM public.episode_feedback
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles;

-- Reset sequences (optional, to start IDs from 1 again)
-- Note: UUID primary keys don't need sequence resets
