# 🛠️ Command Reference

Quick reference for all commands you'll need.

## 📦 Installation

```bash
# Install dependencies
npm install

# Or with specific flags
npm install --legacy-peer-deps
```

## 🔧 Development

```bash
# Start development server
npm run dev

# Development server will run on http://localhost:3000
```

## 🏗️ Building

```bash
# Create production build
npm run build

# Start production server locally
npm run start

# Build and start
npm run build && npm run start
```

## 🧹 Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## 🚀 Deployment

### Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify site
netlify init

# Deploy to production
netlify deploy --prod

# Deploy preview
netlify deploy

# Open Netlify dashboard
netlify open

# Check deployment status
netlify status
```

### Manual Deployment

```bash
# Build locally first
npm run build

# Then deploy via Netlify UI
# or use Git push to auto-deploy
```

## 🗄️ Database Commands

### Supabase SQL Scripts

Run these in Supabase SQL Editor:

```sql
-- 1. Initial setup (run first)
-- Copy and paste: supabase/schema.sql

-- 2. Security policies (run second)
-- Copy and paste: supabase/rls.sql

-- 3. Reset database (optional - for clean launch)
-- Copy and paste: supabase/reset-database.sql

-- 4. Migrate existing users (optional)
-- Copy and paste: supabase/migration-existing-users.sql
```

## 🔍 Testing

```bash
# Type checking
npx tsc --noEmit

# Check for unused dependencies
npx depcheck

# Check bundle size
npm run build
# Look for the "Route (app)" output
```

## 🧰 Maintenance

```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Clean install (if issues)
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Full clean
rm -rf .next node_modules
npm install
npm run build
```

## 🔐 Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit environment variables
# Use your favorite editor:
nano .env.local
# or
code .env.local
```

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Optional Variables

```env
SENTRY_AUTH_TOKEN=your_token
NEXT_PUBLIC_SENTRY_DSN=your_dsn
```

## 📊 Monitoring

### Check Netlify Logs

```bash
# View function logs
netlify functions:log

# View build logs
netlify build

# Watch logs in real-time
netlify dev
```

### Check Supabase

```bash
# Via Supabase Dashboard:
# 1. Go to Database → Logs
# 2. Go to API → Logs
# 3. Go to Auth → Logs
```

## 🐛 Debugging

```bash
# Run with debug output
NODE_OPTIONS='--inspect' npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Verbose build
npm run build -- --debug

# Clear all caches and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## 📱 Testing on Devices

```bash
# Start dev server accessible on local network
npm run dev -- -H 0.0.0.0

# Then access from phone/tablet:
# http://YOUR_LOCAL_IP:3000
# (Find your IP with: ipconfig on Windows, ifconfig on Mac/Linux)
```

## 🔄 Git Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

## 📦 Package Management

```bash
# Add a new package
npm install package-name

# Add as dev dependency
npm install -D package-name

# Remove a package
npm uninstall package-name

# Update a specific package
npm update package-name

# Check package info
npm info package-name
```

## 🎨 Tailwind CSS

```bash
# Tailwind is configured via postcss.config.mjs
# No additional commands needed

# To customize, edit:
# - app/globals.css (for custom styles)
# - tailwind.config.js (for theme customization)
```

## 🔧 Troubleshooting Commands

### Port Already in Use

```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or manually find and kill
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
```

### Build Fails

```bash
# Check Node version (should be 20+)
node --version

# Update npm
npm install -g npm@latest

# Try clean build
rm -rf .next
npm run build
```

## 📚 Useful Scripts

### Check Everything Before Deploy

```bash
# Run all checks
npm run lint && \
npx tsc --noEmit && \
npm run build
```

### Quick Reset

```bash
# Reset everything to clean state
rm -rf .next node_modules package-lock.json && \
npm install && \
npm run dev
```

## 🎯 Production Checklist Commands

```bash
# 1. Lint
npm run lint

# 2. Type check
npx tsc --noEmit

# 3. Build
npm run build

# 4. Test build locally
npm run start

# 5. Deploy
netlify deploy --prod
```

---

## 💡 Pro Tips

1. **Use `npm run dev`** for development - it has hot reload
2. **Always `npm run build`** before deploying to catch build errors
3. **Use `netlify dev`** to test Netlify functions locally
4. **Check logs** in Netlify dashboard after deployment
5. **Test on mobile** using `npm run dev -- -H 0.0.0.0`

---

## 🆘 Need Help?

If a command fails:
1. Check Node version: `node --version` (should be 20+)
2. Clear caches: `rm -rf .next node_modules`
3. Reinstall: `npm install`
4. Try again

---

**Quick Start**: `npm install && npm run dev`

**Quick Deploy**: `npm run build && netlify deploy --prod`

**Quick Reset**: `rm -rf .next && npm run dev`
