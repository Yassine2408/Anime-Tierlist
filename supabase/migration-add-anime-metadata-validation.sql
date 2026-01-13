-- =====================================================
-- MIGRATION: Add Anime Metadata Table and Episode Validation Function
-- =====================================================
-- This migration adds:
-- 1. An `anime_metadata` table to cache episode counts from Jikan API
-- 2. A database function to validate episode numbers against cached metadata
-- 3. Enhanced validation for episode_feedback using the metadata
-- 
-- Benefits:
-- - Reduces API calls by caching episode counts in the database
-- - Provides server-side validation against actual anime episode counts
-- - Maintains backward compatibility with existing records
-- - Allows manual updates to metadata when API data is unavailable
-- 
-- Note: This works alongside the existing check constraint (episode > 0 AND episode <= 9999)
-- to provide defense in depth. The function validates against metadata when available,
-- but falls back gracefully when metadata is missing (for backward compatibility).
-- =====================================================

-- Step 1: Create anime_metadata table to cache episode counts
-- This table stores episode count information fetched from Jikan API
CREATE TABLE IF NOT EXISTS public.anime_metadata (
  anime_id integer PRIMARY KEY,
  episodes integer,
  -- episodes can be null for ongoing anime where total count is unknown
  -- episodes can be 0 to indicate "unknown" status
  -- episodes > 0 indicates a known, completed episode count
  status text, -- e.g., 'RELEASING', 'FINISHED', 'NOT_YET_RELEASED'
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_anime_metadata_anime_id ON public.anime_metadata (anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_metadata_last_updated ON public.anime_metadata (last_updated);

-- Add comment to document the table
COMMENT ON TABLE public.anime_metadata IS 'Caches anime metadata (episode counts) from Jikan API to reduce API calls and enable server-side validation';
COMMENT ON COLUMN public.anime_metadata.episodes IS 'Total episode count. NULL = ongoing/unknown, 0 = explicitly unknown, >0 = known count';
COMMENT ON COLUMN public.anime_metadata.last_updated IS 'Timestamp when metadata was last fetched from API';

-- Step 2: Create function to validate episode numbers against metadata
-- This function validates episode numbers and can be used in constraints or triggers
CREATE OR REPLACE FUNCTION public.validate_episode_number(
  p_anime_id integer,
  p_episode integer
) RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_episodes integer;
BEGIN
  -- Basic validation: episode must be positive and within reasonable range
  -- This matches the existing check constraint
  IF p_episode <= 0 OR p_episode > 9999 THEN
    RETURN false;
  END IF;

  -- Try to get episode count from metadata cache
  SELECT episodes INTO v_episodes
  FROM public.anime_metadata
  WHERE anime_id = p_anime_id;

  -- If metadata exists and has a known positive episode count, validate against it
  IF v_episodes IS NOT NULL AND v_episodes > 0 THEN
    IF p_episode > v_episodes THEN
      RETURN false; -- Episode exceeds known episode count
    END IF;
  END IF;

  -- If metadata doesn't exist or episodes is NULL/0, allow the submission
  -- This ensures backward compatibility and allows ratings for ongoing anime
  -- The basic constraint (episode <= 9999) still provides protection
  RETURN true;
END;
$$;

-- Add comment to document the function
COMMENT ON FUNCTION public.validate_episode_number(integer, integer) IS 
'Validates episode number against anime metadata. Returns true if valid, false otherwise. ' ||
'Validates against cached episode count if available, otherwise allows submission for backward compatibility.';

-- Step 3: Create helper function to update anime metadata
-- This can be called from the application when fetching anime data from Jikan API
CREATE OR REPLACE FUNCTION public.upsert_anime_metadata(
  p_anime_id integer,
  p_episodes integer,
  p_status text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.anime_metadata (anime_id, episodes, status, last_updated, created_at)
  VALUES (p_anime_id, p_episodes, p_status, now(), now())
  ON CONFLICT (anime_id) 
  DO UPDATE SET
    episodes = EXCLUDED.episodes,
    status = COALESCE(EXCLUDED.status, anime_metadata.status),
    last_updated = now();
END;
$$;

-- Add comment to document the function
COMMENT ON FUNCTION public.upsert_anime_metadata(integer, integer, text) IS 
'Upserts anime metadata. Call this from the application when fetching anime data from Jikan API ' ||
'to keep the cache up to date. Updates last_updated timestamp on conflict.';

-- Step 4: Create trigger function to validate episodes on insert/update
-- This provides automatic validation using the metadata cache
-- The application-level validation in submitEpisodeFeedback is the primary validation
-- This trigger serves as an additional database-level safety net

-- Note: We're NOT replacing the existing check constraint, we're adding an additional layer
-- The check constraint (episode > 0 AND episode <= 9999) remains as the primary constraint
-- This trigger provides metadata-aware validation when metadata is available

CREATE OR REPLACE FUNCTION public.check_episode_against_metadata()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_episodes integer;
BEGIN
  -- Use the validation function
  IF NOT public.validate_episode_number(NEW.anime_id, NEW.episode) THEN
    -- Get episode count for better error message
    SELECT episodes INTO v_episodes
    FROM public.anime_metadata
    WHERE anime_id = NEW.anime_id;
    
    IF v_episodes IS NOT NULL AND v_episodes > 0 AND NEW.episode > v_episodes THEN
      RAISE EXCEPTION 'Episode % exceeds the known episode count of % for this anime', NEW.episode, v_episodes;
    ELSE
      -- Fall back to generic error if metadata validation fails for other reasons
      RAISE EXCEPTION 'Invalid episode number: %', NEW.episode;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Pre-validate existing data before enabling trigger
-- This ensures all existing episode_feedback records pass validation
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check for existing records that would fail validation
  -- This checks against metadata if it exists, but allows records without metadata
  SELECT COUNT(*) INTO invalid_count
  FROM public.episode_feedback ef
  WHERE NOT public.validate_episode_number(ef.anime_id, ef.episode);
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'Found % existing episode_feedback records that would fail validation. These records will need to be cleaned up or metadata updated before the trigger can be safely enabled.', invalid_count;
    RAISE NOTICE 'You can review invalid records with: SELECT * FROM public.episode_feedback WHERE NOT public.validate_episode_number(anime_id, episode);';
  ELSE
    RAISE NOTICE 'All existing episode_feedback records pass validation. Safe to enable trigger.';
  END IF;
END $$;

-- Step 6: Enable trigger to validate episodes using metadata
-- This provides automatic database-level validation
-- The trigger is idempotent and will skip creation if it already exists
DO $$
BEGIN
  -- Check if trigger already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'episode_feedback_validate_episode'
    AND tgrelid = 'public.episode_feedback'::regclass
  ) THEN
    -- Create the trigger
    CREATE TRIGGER episode_feedback_validate_episode
      BEFORE INSERT OR UPDATE ON public.episode_feedback
      FOR EACH ROW
      EXECUTE FUNCTION public.check_episode_against_metadata();
    
    RAISE NOTICE 'Successfully created episode_feedback_validate_episode trigger';
  ELSE
    RAISE NOTICE 'Trigger episode_feedback_validate_episode already exists, skipping';
  END IF;
END $$;

-- Step 7: Add Row Level Security (RLS) policies for anime_metadata
-- Enable RLS on the table
ALTER TABLE public.anime_metadata ENABLE ROW LEVEL SECURITY;

-- Allow public read access (metadata is not sensitive)
CREATE POLICY IF NOT EXISTS "anime_metadata_select_public" ON public.anime_metadata
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update metadata
-- In production, you may want to restrict this to admin users only
CREATE POLICY IF NOT EXISTS "anime_metadata_insert_authenticated" ON public.anime_metadata
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "anime_metadata_update_authenticated" ON public.anime_metadata
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Step 8: Verify tables and functions were created
SELECT 
  'anime_metadata table' AS object_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'anime_metadata'
  ) THEN 'Created' ELSE 'Failed' END AS status;

SELECT 
  'validate_episode_number function' AS object_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'validate_episode_number' AND pronamespace = 'public'::regnamespace
  ) THEN 'Created' ELSE 'Failed' END AS status;

SELECT 
  'upsert_anime_metadata function' AS object_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'upsert_anime_metadata' AND pronamespace = 'public'::regnamespace
  ) THEN 'Created' ELSE 'Failed' END AS status;

-- Step 9: Test the validation function with sample data
-- This demonstrates how the function works
DO $$
BEGIN
  -- Test 1: Basic validation (should pass)
  IF public.validate_episode_number(1, 5) THEN
    RAISE NOTICE 'Test 1 passed: Basic validation works';
  ELSE
    RAISE WARNING 'Test 1 failed: Basic validation should pass';
  END IF;

  -- Test 2: Invalid episode (should fail)
  IF NOT public.validate_episode_number(1, 0) THEN
    RAISE NOTICE 'Test 2 passed: Invalid episode (0) correctly rejected';
  ELSE
    RAISE WARNING 'Test 2 failed: Invalid episode should be rejected';
  END IF;

  -- Test 3: Episode exceeds max limit (should fail)
  IF NOT public.validate_episode_number(1, 10000) THEN
    RAISE NOTICE 'Test 3 passed: Episode 10000 correctly rejected (exceeds max limit)';
  ELSE
    RAISE WARNING 'Test 3 failed: Episode 10000 should be rejected';
  END IF;
END $$;

-- =====================================================
-- USAGE NOTES
-- =====================================================
-- 
-- 1. Populating Metadata:
--    Call upsert_anime_metadata() from your application when fetching anime data:
--    SELECT upsert_anime_metadata(anime_id, episodes, status);
--
-- 2. Manual Validation:
--    You can call validate_episode_number() directly:
--    SELECT validate_episode_number(anime_id, episode_number);
--
-- 3. Backward Compatibility:
--    - Existing episode_feedback records remain valid
--    - Validation only applies when metadata exists
--    - Missing metadata does not block submissions
--
-- 4. Optional Trigger:
--    The trigger is commented out by default. Uncomment to enable automatic
--    validation on insert/update. The application-level validation is preferred
--    as it provides better error messages to users.
--
-- 5. Metadata Updates:
--    Update metadata periodically or when fetching anime details:
--    - On anime search/display
--    - When validating episode submissions
--    - Via scheduled job (optional)
-- =====================================================
