# Episode Constraint Migration Instructions

## Quick Start

Run the entire migration script in your Supabase SQL Editor:
```sql
-- Copy and paste the entire contents of migration-add-episode-constraint.sql
```

## Step-by-Step Instructions

### Step 1: Check for Invalid Data

First, check if you have any invalid episode numbers in your database:

```sql
SELECT 
  id,
  anime_id,
  episode,
  user_id,
  created_at
FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999
ORDER BY created_at DESC;
```

**If this query returns rows:**
- You have invalid data that needs to be cleaned up
- See "Cleaning Up Invalid Data" section below
- Do NOT proceed with the migration until invalid data is removed

**If this query returns no rows:**
- Your data is clean
- Proceed directly to "Step 2: Run Migration"

### Step 2: Clean Up Invalid Data (if needed)

If you found invalid rows, you have two options:

**Option A: Delete invalid rows (recommended)**
```sql
DELETE FROM public.episode_feedback
WHERE episode <= 0 OR episode > 9999;
```

**Option B: Fix invalid rows manually**
```sql
-- Example: Update a specific invalid episode number
-- UPDATE public.episode_feedback
-- SET episode = 1
-- WHERE id = 'your-row-id-here' AND episode <= 0;
```

### Step 3: Run the Migration

Copy and paste the entire contents of `migration-add-episode-constraint.sql` into your Supabase SQL Editor and execute it.

The migration will:
1. Check for invalid data (will fail if found)
2. Add the constraint: `episode > 0 AND episode <= 9999`
3. Verify the constraint was added successfully

### Step 4: Verify the Constraint

After running the migration, verify it was added:

```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.episode_feedback'::regclass
AND conname = 'episode_feedback_episode_check';
```

You should see:
- `constraint_name`: `episode_feedback_episode_check`
- `constraint_definition`: `CHECK ((episode > 0) AND (episode <= 9999))`

## Troubleshooting

### Error: "Cannot add constraint: Found X rows with invalid episode numbers"

**Solution:** Clean up the invalid data first (see Step 2 above), then re-run the migration.

### Error: "constraint already exists"

**Solution:** The constraint is already applied. No action needed.

### Migration runs successfully but constraint doesn't appear

**Solution:** 
1. Check if you're looking at the correct schema: `public.episode_feedback`
2. Run the verification query from Step 4
3. Check Supabase logs for any errors

## What This Migration Does

- Adds a database-level check constraint to prevent invalid episode numbers
- Ensures episode numbers are between 1 and 9999
- Works alongside application-level validation for defense in depth
- Prevents negative, zero, or unreasonably large episode numbers

## Notes

- The migration is **idempotent** - safe to run multiple times
- The constraint will automatically reject any future invalid data
- Existing valid data is unaffected
- This migration only adds the constraint; it does not modify existing valid data
