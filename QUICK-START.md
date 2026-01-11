# ⚡ Quick Start Guide

Get your Anime Tierlist up and running in 5 minutes!

## 🎯 Prerequisites

Make sure you have:
- Node.js 20 or higher installed
- A Supabase account (free tier works great!)
- Git installed

## 📦 Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd anime-tierlist

# Install dependencies
npm install
```

## 🗄️ Step 2: Set Up Supabase

### 2.1 Create Project
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details
4. Wait 2-3 minutes for setup

### 2.2 Run Database Scripts
1. Open your Supabase project
2. Go to "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste contents of `supabase/schema.sql`
5. Click "Run"
6. Create another new query
7. Copy and paste contents of `supabase/rls.sql`
8. Click "Run"

### 2.3 Get Your Credentials
1. Go to "Project Settings" (gear icon)
2. Click "API" in the left menu
3. Copy your:
   - Project URL
   - `anon` `public` key

## 🔑 Step 3: Configure Environment

```bash
# Copy the example env file
cp .env.example .env.local

# Open .env.local and add your Supabase credentials
```

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## ✅ Step 5: Test It Out

1. Click "Create Account"
2. Choose a unique username
3. Enter your email and password
4. Check your email for verification
5. Log in and start creating tier lists!

## 🎨 What You Can Do Now

- **Browse Anime**: Check out the library of anime
- **Create Tier Lists**: Build your own rankings
- **Share Lists**: Make them public and share with friends
- **Rate & Review**: Give feedback on anime and episodes
- **Customize**: Toggle dark/light theme

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the root directory
- Verify the variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart the dev server after adding env variables

### "Error: relation does not exist"
- You need to run the database scripts in Supabase
- Go back to Step 2.2 and run `schema.sql` and `rls.sql`

### "Username already taken"
- Usernames must be unique across all users
- Try a different username
- Usernames are case-insensitive

### Build errors
- Make sure you're using Node.js 20 or higher: `node --version`
- Delete `node_modules` and run `npm install` again
- Clear Next.js cache: `rm -rf .next`

## 📚 Next Steps

Once everything is working locally:

1. **Read DEPLOYMENT.md** - Learn how to deploy to Netlify
2. **Check PRE-LAUNCH-CHECKLIST.md** - Ensure everything is ready for production
3. **Customize** - Make it your own!

## 🆘 Need Help?

- Check the main [README.md](./README.md) for detailed info
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Check Supabase docs: https://supabase.com/docs
- Check Next.js docs: https://nextjs.org/docs

---

**Happy building! 🎌**
