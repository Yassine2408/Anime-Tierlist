# Username Migration Guide

## Overview
This migration makes username a required field for all user profiles. All existing profiles will be deleted, and users must register again with a unique username.

## Steps to Apply

### 1. Delete All Existing Profiles

Run this SQL script in your Supabase SQL Editor:

```sql
-- Delete all profiles
DELETE FROM public.profiles;

-- Verify deletion
SELECT COUNT(*) as remaining_profiles FROM public.profiles;
```

**OR** use the provided script:
- `supabase/delete-all-profiles.sql` - Shows profiles before deletion, then deletes them

### 2. Apply Schema Changes

Run the migration script in Supabase SQL Editor:

**File:** `supabase/migration-require-username.sql`

This script will:
- Delete all existing profiles
- Make username NOT NULL (required)
- Update the trigger function to read username from user metadata
- Ensure usernames are unique

### 3. Verify Changes

After running the migration, verify:

```sql
-- Check username column is NOT NULL
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'username';
-- Should show: is_nullable = 'NO'

-- Check unique constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND constraint_name = 'profiles_username_key';
-- Should show: constraint_type = 'UNIQUE'
```

## How It Works

### Signup Flow

1. User enters username in signup form
2. Username is validated (3-20 chars, alphanumeric + underscore)
3. System checks if username is already taken
4. If available, user signs up with username passed in `user_metadata`
5. Database trigger `handle_new_user()` creates profile with username
6. Username is stored in lowercase for consistency

### Username Requirements

- **Length:** 3-20 characters
- **Characters:** Letters (a-z), numbers (0-9), and underscores (_) only
- **Case:** Automatically converted to lowercase
- **Uniqueness:** Enforced by database constraint (unique index)
- **Required:** Cannot be null (enforced by NOT NULL constraint)

### Database Constraints

- `username` column: `NOT NULL`
- `profiles_username_key`: Unique constraint on username
- Trigger function: Automatically sets username from user metadata during signup

## Important Notes

⚠️ **WARNING:** 
- Running the migration will delete ALL existing profiles
- Users will need to register again with usernames
- Auth users will still exist but won't have profiles
- If you want to delete auth users too, you'll need to delete from `auth.users` separately

## Testing

After migration:

1. Try to register a new user with a username
2. Verify username is saved correctly
3. Try to register with the same username (should fail)
4. Try to register without username (should fail - handled by form validation)
5. Check that username is stored in lowercase

## Rollback

If you need to rollback:

```sql
-- Make username nullable again
ALTER TABLE public.profiles 
  ALTER COLUMN username DROP NOT NULL;

-- Note: You'll need to restore profiles from backup if you want to keep existing data
```
