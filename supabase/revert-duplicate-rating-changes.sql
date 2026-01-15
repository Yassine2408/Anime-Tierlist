-- Migration: Revert duplicate rating prevention changes
-- This script removes the unique constraints and updated_at columns that were added
-- to prevent duplicate ratings. This reverts the database to allow duplicate ratings.

-- Step 1: Drop unique constraints if they exist
DO $$
BEGIN
  -- Drop unique constraint on anime_feedback
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'anime_feedback_user_anime_unique'
  ) THEN
    ALTER TABLE public.anime_feedback
    DROP CONSTRAINT anime_feedback_user_anime_unique;
    
    RAISE NOTICE 'Dropped unique constraint on anime_feedback (user_id, anime_id)';
  ELSE
    RAISE NOTICE 'Unique constraint on anime_feedback does not exist, skipping';
  END IF;
END $$;

DO $$
BEGIN
  -- Drop unique constraint on episode_feedback
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'episode_feedback_user_anime_episode_unique'
  ) THEN
    ALTER TABLE public.episode_feedback
    DROP CONSTRAINT episode_feedback_user_anime_episode_unique;
    
    RAISE NOTICE 'Dropped unique constraint on episode_feedback (user_id, anime_id, episode)';
  ELSE
    RAISE NOTICE 'Unique constraint on episode_feedback does not exist, skipping';
  END IF;
END $$;

-- Step 2: Drop unique indexes if they exist (they might have been created separately)
DROP INDEX IF EXISTS public.anime_feedback_user_anime_idx;
DROP INDEX IF EXISTS public.episode_feedback_user_anime_episode_idx;

-- Step 3: Drop updated_at columns if they exist
DO $$
BEGIN
  -- Drop updated_at from anime_feedback
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'anime_feedback' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.anime_feedback
    DROP COLUMN updated_at;
    
    RAISE NOTICE 'Dropped updated_at column from anime_feedback';
  ELSE
    RAISE NOTICE 'updated_at column does not exist on anime_feedback, skipping';
  END IF;
END $$;

DO $$
BEGIN
  -- Drop updated_at from episode_feedback
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'episode_feedback' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.episode_feedback
    DROP COLUMN updated_at;
    
    RAISE NOTICE 'Dropped updated_at column from episode_feedback';
  ELSE
    RAISE NOTICE 'updated_at column does not exist on episode_feedback, skipping';
  END IF;
END $$;

-- Step 4: Verification queries
-- Uncomment to verify constraints were removed:
-- SELECT conname, contype FROM pg_constraint 
-- WHERE conrelid IN ('public.anime_feedback'::regclass, 'public.episode_feedback'::regclass) 
-- AND contype = 'u';

-- Uncomment to verify columns were removed:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('anime_feedback', 'episode_feedback')
-- AND column_name = 'updated_at';
