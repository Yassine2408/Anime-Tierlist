# 🚀 Vercel Deployment Guide

## Quick Deploy Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub (if not already)

2. **Import Your Project**
   - Click **"Add New..."** → **"Project"**
   - Find and select **"Yassine2408/Anime-Tierlist"**
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables**
   Click **"Environment Variables"** and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   Optional (for Sentry):
   ```
   SENTRY_AUTH_TOKEN=your_sentry_token
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```

5. **Deploy!**
   - Click **"Deploy"**
   - Wait 2-3 minutes for build
   - Your site will be live! 🎉

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # From your project directory
   vercel
   
   # For production deployment
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

---

## ✅ Why Vercel is Better for Next.js

- ✅ **Native Next.js Support** - Made by the same team
- ✅ **Automatic Optimizations** - Built-in performance features
- ✅ **Zero Configuration** - Auto-detects Next.js
- ✅ **Fast Builds** - Optimized build pipeline
- ✅ **Edge Functions** - Serverless functions support
- ✅ **Image Optimization** - Built-in Next.js Image optimization
- ✅ **Preview Deployments** - Automatic previews for PRs

---

## 🔧 Configuration

Your `vercel.json` is already configured:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}
```

Vercel will auto-detect Next.js, so this is mostly optional!

---

## 📊 Environment Variables

### Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### Optional:
- `SENTRY_AUTH_TOKEN` - For error tracking
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN

---

## 🎯 Post-Deployment

1. **Verify Deployment**
   - Visit your Vercel URL (e.g., `anime-tierlist.vercel.app`)
   - Test user registration
   - Create a tier list
   - Test sharing functionality

2. **Update Supabase Auth Settings**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to:
     - Site URL
     - Redirect URLs

3. **Custom Domain (Optional)**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain
   - Update Supabase redirect URLs with new domain

---

## 🔄 Continuous Deployment

Once connected to GitHub:
- ✅ Every push to `main` = Production deployment
- ✅ Every PR = Preview deployment
- ✅ Automatic builds
- ✅ Build logs and analytics

---

## 🆘 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Ensure all dependencies are in `package.json`

### TypeScript Errors
- Vercel uses the same TypeScript setup as local
- Fix errors locally first: `npm run build`
- Then push to trigger Vercel build

### Environment Variables Not Working
- Make sure they're set in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## 🎉 You're Ready!

Your project is configured for Vercel. Just:
1. Import to Vercel
2. Add environment variables
3. Deploy!

**That's it!** Vercel handles the rest automatically. 🚀
