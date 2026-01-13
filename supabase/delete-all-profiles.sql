-- =====================================================
-- DELETE ALL PROFILES SCRIPT
-- =====================================================
-- WARNING: This will delete ALL user profiles from the database!
-- This should only be run when you want to reset all profiles
-- and require users to register again with usernames.
-- =====================================================

-- Step 1: View all profiles before deletion (for reference)
SELECT 
  id,
  username,
  display_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Step 2: Delete all profiles
-- WARNING: This will permanently delete all profiles
-- Uncomment the line below to execute the deletion
-- DELETE FROM public.profiles;

-- Step 3: Verify all profiles are deleted (should return 0 rows)
SELECT COUNT(*) as remaining_profiles
FROM public.profiles;

-- =====================================================
-- NOTES:
-- =====================================================
-- - This only deletes profiles, NOT auth users
-- - Auth users will still exist but won't have profiles
-- - Users will need to register again to get a profile
-- - If you want to delete auth users too, you'll need to:
--   DELETE FROM auth.users;
--   (This requires admin access and is more destructive)
-- =====================================================
