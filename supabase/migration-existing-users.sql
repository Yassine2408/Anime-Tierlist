-- =====================================================
-- MIGRATION SCRIPT FOR EXISTING USERS
-- =====================================================
-- This script is for updating existing users who signed up
-- before the username system was implemented.
-- =====================================================

-- Option 1: Generate default usernames for existing users without usernames
-- This creates usernames like "user_abc123" based on their user ID

UPDATE public.profiles
SET 
  username = CONCAT('user_', SUBSTRING(id::text, 1, 8)),
  display_name = CONCAT('User ', SUBSTRING(id::text, 1, 6))
WHERE username IS NULL;

-- Option 2: If you prefer to leave them NULL and force users to set on next login
-- (You would need to add UI logic to prompt username selection)
-- Just skip this migration and handle it in the app

-- Verify the update
SELECT 
  id,
  username,
  display_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
