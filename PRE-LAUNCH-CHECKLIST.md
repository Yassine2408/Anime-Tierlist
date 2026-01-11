# 🚀 Pre-Launch Checklist

Use this checklist to ensure everything is ready before your official launch.

## ✅ Database Setup

- [ ] **Create Supabase Project**
  - Go to [supabase.com](https://supabase.com)
  - Create a new project
  - Wait for initialization to complete

- [ ] **Run Database Migrations**
  - [ ] Execute `supabase/schema.sql` in SQL Editor
  - [ ] Execute `supabase/rls.sql` in SQL Editor
  - [ ] Verify all tables are created
  - [ ] Verify all RLS policies are active

- [ ] **Test Database**
  - [ ] Create a test user account
  - [ ] Verify profile is auto-created
  - [ ] Test creating a tier list
  - [ ] Test public sharing
  - [ ] Test feedback submission

- [ ] **Reset for Launch** (if needed)
  - [ ] Run `supabase/reset-database.sql` to clear test data
  - [ ] Verify all tables are empty

## ✅ Supabase Configuration

- [ ] **Authentication Settings**
  - [ ] Enable Email authentication
  - [ ] Configure email templates (optional)
  - [ ] Set up email confirmation (recommended)
  - [ ] Add your site URL to allowed redirect URLs
  - [ ] Test email verification flow

- [ ] **API Settings**
  - [ ] Copy Project URL
  - [ ] Copy Anon/Public Key
  - [ ] Keep Service Role Key secure (don't expose client-side)

- [ ] **Security**
  - [ ] Verify RLS is enabled on all tables
  - [ ] Test that users can't access other users' data
  - [ ] Test public tier list viewing
  - [ ] Verify username uniqueness constraint

## ✅ Netlify Setup

- [ ] **Create Netlify Account**
  - [ ] Sign up at [netlify.com](https://netlify.com)
  - [ ] Connect to your GitHub account

- [ ] **Deploy Site**
  - [ ] Import repository from GitHub
  - [ ] Verify build settings:
    - Build command: `npm run build`
    - Publish directory: `.next`
    - Node version: 20
  - [ ] Deploy site

- [ ] **Environment Variables**
  - [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] (Optional) Add Sentry variables if using error tracking
  - [ ] Trigger redeploy after adding variables

- [ ] **Domain Setup** (optional)
  - [ ] Add custom domain
  - [ ] Configure DNS
  - [ ] Enable HTTPS
  - [ ] Update Supabase redirect URLs with new domain

## ✅ Application Testing

- [ ] **Authentication Flow**
  - [ ] Test user registration with username
  - [ ] Verify email confirmation works
  - [ ] Test login
  - [ ] Test logout
  - [ ] Test password reset (if implemented)

- [ ] **Username System**
  - [ ] Test username validation (3-20 chars)
  - [ ] Test special character rejection
  - [ ] Test duplicate username prevention
  - [ ] Verify username displays in feed
  - [ ] Test case-insensitive uniqueness

- [ ] **Tier Lists**
  - [ ] Create a new tier list
  - [ ] Add anime to tiers
  - [ ] Drag and drop between tiers
  - [ ] Save tier list
  - [ ] Edit existing tier list
  - [ ] Delete tier list
  - [ ] Test public/private toggle

- [ ] **Sharing**
  - [ ] Share a public tier list
  - [ ] Access shared tier list via URL
  - [ ] Verify non-owners can view but not edit
  - [ ] Test share link copying

- [ ] **Feedback System**
  - [ ] Submit anime rating
  - [ ] Submit episode rating
  - [ ] Add comments
  - [ ] View feedback in community feed
  - [ ] Verify username displays correctly
  - [ ] Test "You" vs other usernames

- [ ] **UI/UX**
  - [ ] Test dark/light theme toggle
  - [ ] Test on mobile devices
  - [ ] Test on tablet
  - [ ] Test on desktop
  - [ ] Verify all images load
  - [ ] Check for broken links
  - [ ] Test all navigation

- [ ] **Performance**
  - [ ] Check page load times
  - [ ] Verify images are optimized
  - [ ] Test with slow network
  - [ ] Check for console errors

## ✅ Code Quality

- [ ] **Linting**
  - [ ] Run `npm run lint`
  - [ ] Fix any errors or warnings

- [ ] **Build**
  - [ ] Run `npm run build` locally
  - [ ] Verify no build errors
  - [ ] Check build output size

- [ ] **Environment Variables**
  - [ ] Verify `.env.example` is up to date
  - [ ] Ensure no secrets in code
  - [ ] Verify `.gitignore` includes `.env*`

## ✅ Documentation

- [ ] **README.md**
  - [ ] Clear setup instructions
  - [ ] Feature list is accurate
  - [ ] Tech stack documented
  - [ ] Links work

- [ ] **DEPLOYMENT.md**
  - [ ] Step-by-step deployment guide
  - [ ] Environment variables documented
  - [ ] Troubleshooting section

- [ ] **Code Comments**
  - [ ] Complex logic is commented
  - [ ] TODO items are resolved or documented

## ✅ Security

- [ ] **Environment Variables**
  - [ ] No secrets committed to Git
  - [ ] Production keys are different from development
  - [ ] Service role key is never exposed client-side

- [ ] **Database**
  - [ ] RLS enabled on all tables
  - [ ] Policies tested and working
  - [ ] No SQL injection vulnerabilities

- [ ] **Authentication**
  - [ ] Email verification enabled
  - [ ] Password requirements met
  - [ ] Session management working

## ✅ Optional Enhancements

- [ ] **Error Tracking**
  - [ ] Set up Sentry account
  - [ ] Add Sentry DSN to environment
  - [ ] Test error reporting

- [ ] **Analytics** (if desired)
  - [ ] Set up analytics service
  - [ ] Add tracking code
  - [ ] Verify events are tracked

- [ ] **SEO**
  - [ ] Add meta tags
  - [ ] Add Open Graph tags
  - [ ] Create sitemap
  - [ ] Add robots.txt

- [ ] **Monitoring**
  - [ ] Set up uptime monitoring
  - [ ] Configure alerts
  - [ ] Monitor database usage

## ✅ Launch Day

- [ ] **Final Checks**
  - [ ] Run full test suite
  - [ ] Verify production environment
  - [ ] Check all integrations
  - [ ] Test from different devices/browsers

- [ ] **Communication**
  - [ ] Prepare launch announcement
  - [ ] Share with community
  - [ ] Monitor for issues

- [ ] **Post-Launch**
  - [ ] Monitor error logs
  - [ ] Watch for user feedback
  - [ ] Be ready to hotfix issues
  - [ ] Celebrate! 🎉

## 📞 Support Resources

- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs
- **Netlify**: https://docs.netlify.com
- **Sentry**: https://docs.sentry.io

---

**Remember**: It's better to launch with a solid foundation than to rush with bugs. Take your time with this checklist!

Good luck with your launch! 🚀
