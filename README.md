# 🎌 Anime Tierlist

Create, share, and browse anime tier lists with a beautiful modern UI. Built with Next.js, Supabase, and drag-and-drop functionality.

## ✨ Features

- 🔐 **User Authentication** - Secure email-based auth with unique usernames
- 📊 **Tier List Creator** - Drag-and-drop interface for creating custom tier lists
- 🌐 **Public Sharing** - Share your tier lists with unique URLs
- 💬 **Feedback System** - Rate and comment on anime and episodes
- 🎨 **Dark/Light Mode** - Beautiful theme support with persistence
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🖼️ **Export to Image** - Download your tier lists as images
- ⚡ **Real-time Updates** - Instant synchronization across devices

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- A Supabase account
- (Optional) A Netlify account for deployment

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd anime-tierlist
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up the database**
   - Go to your Supabase project's SQL Editor
   - Run `supabase/schema.sql` first
   - Then run `supabase/rls.sql`

5. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automatically on every push!

## 🗄️ Database Schema

The application uses the following main tables:

- **tier_lists** - User-created tier lists
- **tier_list_items** - Individual anime items in tier lists
- **profiles** - User profiles with unique usernames
- **anime_feedback** - Anime ratings and comments
- **episode_feedback** - Episode-specific ratings and comments

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only modify their own data
- Public tier lists are read-only for non-owners
- Unique username validation
- Secure authentication via Supabase

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **Drag & Drop**: @dnd-kit
- **Type Safety**: TypeScript
- **Error Tracking**: Sentry (optional)

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🎯 User Features

### Registration
- Unique username selection (3-20 characters)
- Email verification
- Automatic profile creation

### Tier Lists
- Create custom tier lists with S, A, B, C, D, F tiers
- Drag and drop anime between tiers
- Public/private visibility toggle
- Share with unique URLs
- Export as images

### Feedback
- Rate anime (1-10 scale)
- Write reviews and comments
- Episode-specific feedback
- View community ratings

## 🔄 Resetting for Launch

To reset the database for official launch, run `supabase/reset-database.sql` in your Supabase SQL Editor. This will clear all test data while preserving the schema.

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions, please check:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Netlify Documentation](https://docs.netlify.com)
