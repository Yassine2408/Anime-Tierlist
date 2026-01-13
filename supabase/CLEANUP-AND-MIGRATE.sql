-- =====================================================
-- STEP 1: View Invalid Episode Rows
-- =====================================================
-- This shows you which rows have invalid episode numbers
SELECT 
  id,
  anime_id,
  episode,
  user_id,
  created_at,
  rating,
  comment
FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999
ORDER BY created_at DESC;

-- =====================================================
-- STEP 2: Delete Invalid Rows
-- =====================================================
-- Uncomment and run this to delete invalid rows
-- WARNING: This will permanently delete these feedback entries
DELETE FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999;

-- =====================================================
-- STEP 3: Verify All Rows Are Valid
-- =====================================================
-- This should return 0 rows after cleanup
SELECT COUNT(*) as remaining_invalid_rows
FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999;

-- =====================================================
-- STEP 4: Add the Constraint
-- =====================================================
-- Now run this to add the constraint
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'episode_feedback_episode_check'
    AND conrelid = 'public.episode_feedback'::regclass
  ) THEN
    -- Add the check constraint
    ALTER TABLE public.episode_feedback
    ADD CONSTRAINT episode_feedback_episode_check
    CHECK (episode > 0 AND episode <= 9999);
    
    RAISE NOTICE 'Successfully added episode_feedback_episode_check constraint';
  ELSE
    RAISE NOTICE 'Constraint already exists, skipping';
  END IF;
END $$;

-- =====================================================
-- STEP 5: Verify Constraint Was Added
-- =====================================================
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.episode_feedback'::regclass
AND conname = 'episode_feedback_episode_check';
