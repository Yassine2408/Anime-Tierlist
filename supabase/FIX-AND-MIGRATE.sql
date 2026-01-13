-- =====================================================
-- FIX INVALID ROW AND ADD CONSTRAINT
-- =====================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- =====================================================

-- Step 1: Delete the invalid row (episode = 0)
DELETE FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999;

-- Step 2: Verify no invalid rows remain (should return 0)
SELECT COUNT(*) as invalid_rows_remaining
FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999;

-- Step 3: Add the constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'episode_feedback_episode_check'
    AND conrelid = 'public.episode_feedback'::regclass
  ) THEN
    ALTER TABLE public.episode_feedback
    ADD CONSTRAINT episode_feedback_episode_check
    CHECK (episode > 0 AND episode <= 9999);
    
    RAISE NOTICE '✅ Constraint added successfully!';
  ELSE
    RAISE NOTICE 'ℹ️ Constraint already exists';
  END IF;
END $$;

-- Step 4: Verify the constraint exists
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.episode_feedback'::regclass
AND conname = 'episode_feedback_episode_check';
