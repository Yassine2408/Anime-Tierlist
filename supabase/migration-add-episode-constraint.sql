-- =====================================================
-- MIGRATION: Add Episode Number Validation Constraint
-- =====================================================
-- This migration adds a check constraint to the episode_feedback table
-- to ensure episode numbers are positive integers within a reasonable range.
-- 
-- Constraint: episode > 0 AND episode <= 9999
-- 
-- This prevents:
-- - Negative episode numbers
-- - Zero episode numbers
-- - Unreasonably large episode numbers (beyond any real anime series)
-- 
-- Note: This constraint works alongside client-side and application-level
-- validation to provide defense in depth.
-- =====================================================

-- Step 1: Check for existing invalid data BEFORE adding constraint
-- This prevents the constraint addition from failing
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM public.episode_feedback
  WHERE episode <= 0 OR episode > 9999;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Cannot add constraint: Found % rows with invalid episode numbers (<= 0 or > 9999). Please clean up these rows before applying the constraint. Run the query in Step 2 to see invalid rows.', invalid_count;
  ELSE
    RAISE NOTICE 'No invalid episode numbers found. Safe to proceed with constraint.';
  END IF;
END $$;

-- Step 2: Show invalid rows (if any) for manual review
-- Uncomment the DELETE statement below if you want to automatically remove invalid rows
-- WARNING: This will permanently delete invalid episode feedback entries
SELECT 
  id,
  anime_id,
  episode,
  user_id,
  created_at
FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999
ORDER BY created_at DESC;

-- Optional: Uncomment to automatically delete invalid rows
-- DELETE FROM public.episode_feedback
-- WHERE episode <= 0 OR episode > 9999;

-- Step 3: Add constraint (idempotent - safe to run multiple times)
DO $$
BEGIN
  -- Check if the constraint already exists
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
    RAISE NOTICE 'Constraint episode_feedback_episode_check already exists, skipping';
  END IF;
END $$;

-- Step 4: Verify constraint was added successfully
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.episode_feedback'::regclass
AND conname = 'episode_feedback_episode_check';
