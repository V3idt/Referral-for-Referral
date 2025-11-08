# Supabase Setup Guide

This application now uses **Supabase** as its backend database and authentication system.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New project"
3. Fill in your project details:
   - Project name: `referral-for-referral` (or your choice)
   - Database password: (save this securely)
   - Region: Choose closest to you
4. Click "Create new project" and wait for it to initialize

### 2. Set Up the Database

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute

This will create:
- All necessary tables (users, referral_links, exchanges, messages, ratings)
- Row Level Security (RLS) policies
- Database indexes for performance
- Storage bucket for proof images
- Auto-update timestamps

### 3. Configure Environment Variables

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create `.env.local` in your project root:

```bash
cp .env.example .env.local
```

4. Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation and password reset emails

#### Recommended Settings:

- **Site URL**: `http://localhost:3000` (dev) or your production URL
- **Redirect URLs**: Add your production URL
- Enable "Auto Confirm" for development (disable in production)

### 5. Set Up Storage (for Proof Images)

The migration already created the `proof-images` bucket. Verify:

1. Go to **Storage** in Supabase dashboard
2. You should see a `proof-images` bucket
3. It's configured as public (anyone can view)
4. Only authenticated users can upload

### 6. Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. Try to sign up/sign in
4. Create a referral link
5. Send a message

## 📊 Database Schema

### Tables

#### `users`
- Extends Supabase auth.users
- Stores reputation_score, total_ratings, last_active
- Automatically created when user signs up

#### `referral_links`
- User's referral links
- Status: active, paused, fulfilled
- Linked to user via user_id

#### `exchanges`
- Tracks referral exchanges between users
- Status: pending, accepted, completed, cancelled

#### `messages`
- Direct messages between users
- Supports proof images via proof_url
- Real-time subscriptions enabled

#### `ratings`
- User ratings (trustworthiness)
- Affects reputation_score
- One rating per user pair

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- **Users**: Anyone can view, users can update own profile
- **Referral Links**: Public read for active links, CRUD for own links
- **Exchanges**: Users see only their exchanges
- **Messages**: Users see sent/received messages only
- **Ratings**: Public read, users can only create ratings

### Storage Security

- Public read access to proof images
- Only authenticated users can upload
- Users can only modify their own uploads

## 🔄 Real-Time Features

Messages support real-time subscriptions out of the box:

```typescript
import { messages } from '@/lib/supabase/api';

// Subscribe to new messages
const subscription = messages.subscribe(userId, (newMessage) => {
  console.log('New message:', newMessage);
});

// Unsubscribe when done
subscription.unsubscribe();
```

## 📝 API Usage

The app uses a compatibility layer that matches the original Base44 API:

```typescript
import { base44 } from '@/lib/base44Client';

// Authentication
const user = await base44.auth.me();
await base44.auth.updateMe({ last_active: new Date().toISOString() });

// Referral Links
const links = await base44.entities.ReferralLink.list();
const myLinks = await base44.entities.ReferralLink.filter({ user_id: user.id });

// Messages
const messages = await base44.entities.Message.filter({ receiver_id: user.id });

// File Upload
const { file_url } = await base44.integrations.Core.UploadFile({ file });
```

## 🎯 Production Checklist

Before deploying to production:

- [ ] Disable "Auto Confirm" in Auth settings
- [ ] Set up custom email templates
- [ ] Configure proper Site URL and Redirect URLs
- [ ] Set up database backups (Settings → Database → Backups)
- [ ] Enable email rate limiting
- [ ] Review and test RLS policies
- [ ] Set up monitoring/alerts
- [ ] Add proper error tracking (Sentry recommended)

## 🔧 Troubleshooting

### "Failed to fetch" errors

- Check environment variables are set correctly
- Verify Supabase project is not paused
- Check browser console for CORS errors

### Authentication issues

- Ensure Email provider is enabled
- Check Site URL matches your app URL
- Verify user exists in Authentication → Users

### Permission denied errors

- Check RLS policies are set up correctly
- Verify user is authenticated
- Check database logs in Supabase dashboard

### Real-time not working

- Ensure Supabase Realtime is enabled (Settings → API)
- Check browser console for subscription errors
- Verify table has proper RLS policies

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

## 💡 Tips

1. **Use the Supabase Dashboard**: It has excellent tools for:
   - SQL Editor (test queries)
   - Table Editor (view/edit data)
   - Auth management
   - Storage browser
   - Real-time logs

2. **Enable Database Webhooks**: Get notified of events
   - Database → Webhooks
   - Useful for sending emails, notifications, etc.

3. **Use Database Functions**: For complex operations
   - Write SQL functions for atomic operations
   - Call from app with `.rpc()`

4. **Monitor Usage**: Free tier limits:
   - 500MB database
   - 1GB file storage
   - 2GB bandwidth/month
   - 50,000 monthly active users

## 🆘 Need Help?

- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)
- Check the main README.md for app-specific help

