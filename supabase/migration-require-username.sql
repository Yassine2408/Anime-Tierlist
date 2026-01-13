-- =====================================================
-- MIGRATION: Make Username Required and Update Trigger
-- =====================================================
-- This migration:
-- 1. Deletes all existing profiles (users must re-register)
-- 2. Makes username NOT NULL and required
-- 3. Updates the trigger to set username from user metadata
-- =====================================================

-- Step 1: Delete all existing profiles
-- WARNING: This will delete ALL profiles!
-- Users will need to register again with usernames
DELETE FROM public.profiles;

-- Step 2: Verify all profiles are deleted
SELECT COUNT(*) as remaining_profiles FROM public.profiles;
-- Should return 0

-- Step 3: Drop the existing trigger function to recreate it
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 4: Update the profiles table to make username NOT NULL
-- First, we need to drop the unique constraint temporarily
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Make username NOT NULL
ALTER TABLE public.profiles 
  ALTER COLUMN username SET NOT NULL;

-- Re-add the unique constraint
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- Step 5: Recreate the trigger function with username support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username text;
  v_display_name text;
BEGIN
  -- Get username from user metadata (set during signup)
  v_username := new.raw_user_meta_data->>'username';
  v_display_name := new.raw_user_meta_data->>'display_name';
  
  -- If username is not provided in metadata, generate a temporary one
  -- This should not happen if signup form is working correctly
  IF v_username IS NULL OR v_username = '' THEN
    v_username := 'user_' || substring(new.id::text, 1, 8);
  END IF;
  
  -- Insert profile with username (required field)
  INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
  VALUES (
    new.id, 
    lower(v_username), -- Store username in lowercase for consistency
    coalesce(v_display_name, v_username),
    now(), 
    now()
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- If username already exists, append a random suffix
    v_username := v_username || '_' || substring(new.id::text, 1, 4);
    INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
    VALUES (new.id, lower(v_username), coalesce(v_display_name, v_username), now(), now());
    RETURN new;
END;
$$;

-- Step 6: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Verify the changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'username';

-- Should show: is_nullable = 'NO'

-- =====================================================
-- NOTES:
-- =====================================================
-- After running this migration:
-- 1. All existing profiles will be deleted
-- 2. Username is now required for all new signups
-- 3. The signup form must pass username in user metadata
-- 4. Usernames are stored in lowercase for consistency
-- 5. Usernames must be unique (enforced by database constraint)
-- =====================================================
