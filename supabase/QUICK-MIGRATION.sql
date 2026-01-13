-- =====================================================
-- QUICK MIGRATION: Add Episode Number Constraint
-- =====================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- =====================================================

-- Step 1: Check for invalid data (optional - for information)
SELECT 
  COUNT(*) as invalid_count,
  'Run the query below to see invalid rows' as note
FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999;

-- Step 2: Show invalid rows (if any exist, clean them up first)
SELECT 
  id,
  anime_id,
  episode,
  user_id,
  created_at
FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999
ORDER BY created_at DESC;

-- Step 3: Clean up invalid data (UNCOMMENT IF NEEDED)
-- DELETE FROM public.episode_feedback
-- WHERE episode <= 0 OR episode > 9999;

-- Step 4: Add constraint (will fail if invalid data exists)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check for invalid data first
  SELECT COUNT(*) INTO invalid_count
  FROM public.episode_feedback
  WHERE episode <= 0 OR episode > 9999;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Cannot add constraint: Found % rows with invalid episode numbers (<= 0 or > 9999). Please clean up these rows first by uncommenting the DELETE statement in Step 3.', invalid_count;
  END IF;
  
  -- Add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'episode_feedback_episode_check'
    AND conrelid = 'public.episode_feedback'::regclass
  ) THEN
    ALTER TABLE public.episode_feedback
    ADD CONSTRAINT episode_feedback_episode_check
    CHECK (episode > 0 AND episode <= 9999);
    
    RAISE NOTICE 'Successfully added episode_feedback_episode_check constraint';
  ELSE
    RAISE NOTICE 'Constraint already exists, skipping';
  END IF;
END $$;

-- Step 5: Verify constraint was added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.episode_feedback'::regclass
AND conname = 'episode_feedback_episode_check';
