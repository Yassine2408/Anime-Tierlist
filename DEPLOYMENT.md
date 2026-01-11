# Anime Tierlist - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- A Supabase account and project
- A Netlify account
- Node.js 20+ installed locally

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up

### Run Database Migrations

Execute the SQL files in the `supabase` folder in this order:

1. **schema.sql** - Creates tables and triggers
   - Navigate to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Click "Run"

2. **rls.sql** - Sets up Row Level Security policies
   - Copy and paste the contents of `supabase/rls.sql`
   - Click "Run"

### Get Your Supabase Credentials

1. Go to Project Settings → API
2. Copy your:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## 2. Netlify Deployment

### Option A: Deploy via Netlify UI

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and log in
3. Click "Add new site" → "Import an existing project"
4. Connect to your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 20

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

### Configure Environment Variables

In Netlify Dashboard → Site settings → Environment variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Optional** - For Sentry error tracking:
```
SENTRY_AUTH_TOKEN=your_sentry_auth_token
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## 3. Post-Deployment

### Verify the Deployment

1. Visit your deployed site URL
2. Test user registration with a unique username
3. Create a test tier list
4. Test sharing functionality

### Update Supabase Auth Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Netlify site URL to:
   - Site URL
   - Redirect URLs

Example:
```
https://your-site.netlify.app
```

## 4. Database Reset (Fresh Launch)

If you need to reset the database for official launch:

### Clear All Data

```sql
-- Delete all tier list items
DELETE FROM public.tier_list_items;

-- Delete all tier lists
DELETE FROM public.tier_lists;

-- Delete all feedback
DELETE FROM public.anime_feedback;
DELETE FROM public.episode_feedback;

-- Delete all profiles (this will cascade delete associated data)
DELETE FROM public.profiles;

-- Note: User accounts in auth.users will remain but profiles will be recreated on next login
```

### Or Drop and Recreate Tables

```sql
-- Drop tables
DROP TABLE IF EXISTS public.tier_list_items CASCADE;
DROP TABLE IF EXISTS public.tier_lists CASCADE;
DROP TABLE IF EXISTS public.anime_feedback CASCADE;
DROP TABLE IF EXISTS public.episode_feedback CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Then re-run schema.sql and rls.sql
```

## 5. Monitoring and Maintenance

### Check Logs

- **Netlify**: Dashboard → Deploys → Deploy log
- **Supabase**: Dashboard → Database → Logs

### Performance Monitoring

If using Sentry:
1. Create a Sentry project
2. Add environment variables to Netlify
3. Monitor errors at sentry.io

## Troubleshooting

### Build Fails

- Check Node version is 20+
- Verify all environment variables are set
- Check build logs in Netlify

### Authentication Issues

- Verify Supabase URL and keys are correct
- Check redirect URLs in Supabase Auth settings
- Ensure RLS policies are applied

### Username Conflicts

- Usernames are unique and case-insensitive
- Users must choose a username during registration
- Usernames are validated (3-20 chars, alphanumeric + underscore)

## Features

✅ User authentication with email verification
✅ Unique username system (3-20 characters)
✅ Create and manage anime tier lists
✅ Public sharing with unique share IDs
✅ Anime feedback and ratings
✅ Episode-specific feedback
✅ Dark/Light theme support
✅ Responsive design
✅ Row Level Security for data protection

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Check Next.js documentation: https://nextjs.org/docs
- Check Netlify documentation: https://docs.netlify.com
