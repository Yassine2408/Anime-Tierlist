# Fixing Vercel Deployment Issues

## Issue: Vercel showing old version even after redeployment

### Step 1: Clear Vercel Build Cache

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (Anime-Tierlist)
3. Go to **Settings** → **General**
4. Scroll down to **Build & Development Settings**
5. Click **Clear Build Cache** or **Redeploy** with "Clear Cache" option enabled

### Step 2: Force a New Deployment

**Option A: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** menu → **Redeploy**
4. **IMPORTANT**: Check the box **"Use existing Build Cache"** and **UNCHECK IT** (this clears the cache)
5. Click **Redeploy**

**Option B: Via Git (Recommended)**
```bash
# Create an empty commit to trigger redeploy
git commit --allow-empty -m "Trigger Vercel redeploy with cache clear"
git push
```

### Step 3: Verify Deployment Settings

1. Go to **Settings** → **Git**
2. Verify:
   - **Production Branch**: Should be `main`
   - **Root Directory**: Should be `/` (or leave empty)
   - **Build Command**: Should be `npm run build` (or leave default)
   - **Output Directory**: Should be `.next` (or leave default)

### Step 4: Check Build Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check the **Build Logs** for any errors
4. Look for:
   - TypeScript errors
   - Build failures
   - Missing dependencies
   - Environment variable issues

### Step 5: Verify Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Make sure they're available for **Production**, **Preview**, and **Development**

### Step 6: Clear Browser Cache

If Vercel shows the new deployment but you still see old content:
1. **Hard Refresh**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear Browser Cache**: 
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Or use Incognito/Private mode to test

### Step 7: Check Deployment Status

1. In Vercel dashboard, check if deployment shows:
   - ✅ **Ready** (green) - Deployment successful
   - ⚠️ **Building** - Still in progress
   - ❌ **Error** - Build failed (check logs)

### Step 8: Verify Git Integration

1. Go to **Settings** → **Git**
2. Check **"Connected Git Repository"**
3. Verify it's connected to: `Yassine2408/Anime-Tierlist`
4. Check **"Production Branch"** is `main`

### Step 9: Manual Trigger (If needed)

If automatic deployments aren't working:
1. Go to **Deployments** tab
2. Click **"Create Deployment"**
3. Select:
   - **Branch**: `main`
   - **Framework Preset**: Next.js
   - **Root Directory**: `/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Click **Deploy**

## Common Issues and Solutions

### Issue: "Build succeeded but old code shows"
**Solution**: Clear browser cache and hard refresh

### Issue: "Deployment stuck on Building"
**Solution**: 
- Cancel the deployment
- Clear build cache
- Redeploy

### Issue: "TypeScript errors in build"
**Solution**: 
- Check build logs for specific errors
- Fix TypeScript issues locally first
- Push fixes and redeploy

### Issue: "Environment variables not found"
**Solution**:
- Verify env vars are set in Vercel dashboard
- Make sure they start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing env vars

## Quick Fix Command

Run this to trigger a fresh deployment:
```bash
git commit --allow-empty -m "Force Vercel redeploy - $(date)"
git push
```

Then in Vercel dashboard, redeploy with cache cleared.
