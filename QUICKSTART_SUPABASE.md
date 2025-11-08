# ⚡ Quick Start with Supabase (5 Minutes)

Get your Referral-for-Referral app running with Supabase in 5 minutes!

## Step 1: Create Supabase Project (2 min)

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New project"**
3. Fill in:
   - Name: `referral-for-referral`
   - Database Password: (save it somewhere secure)
   - Region: (choose closest to you)
4. Click **"Create new project"**
5. Wait ~2 minutes for project to initialize

## Step 2: Set Up Database (1 min)

1. In your Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open `supabase/migrations/001_initial_schema.sql` from this project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

✅ **Database is ready!** (tables, security policies, storage bucket created)

## Step 3: Get API Keys (30 seconds)

1. In Supabase dashboard, go to **Settings** → **API** (left sidebar)
2. Find your **Project URL** (starts with `https://`)
3. Copy the **anon** **public** key (long string)

## Step 4: Configure Your App (1 min)

1. In your project folder, copy the example file:
```bash
cp .env.example .env.local
```

2. Open `.env.local` and paste your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_long_anon_key_here
```

## Step 5: Run the App (30 seconds)

```bash
npm install    # if you haven't already
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Test It! (1 min)

1. Click **"Sign In"** (bottom left)
2. Since there's no auth page yet, let's enable auto-confirm:
   - Go to Supabase → **Authentication** → **Providers**
   - Enable **Email** provider
   - **For development only**: Go to **Authentication** → **URL Configuration**
   - Enable "Disable email confirmations" (turn this OFF in production!)

3. Now you can sign up and start using the app!

## 🎉 You're Done!

Your app is now running with:
- ✅ Supabase PostgreSQL database
- ✅ Row Level Security (RLS) policies
- ✅ Authentication system
- ✅ File storage for proof images
- ✅ Real-time messaging support

## Next Steps

### Add Authentication UI (Optional)

Create a simple login page at `app/auth/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (!error) alert('Check your email for confirmation!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleAuth} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h1>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-gray-600"
        >
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        </button>
      </form>
    </div>
  );
}
```

### Production Checklist

Before deploying:
- [ ] Disable "Disable email confirmations" in Supabase Auth settings
- [ ] Set up custom email templates
- [ ] Add your production URL to "Site URL" in Auth settings
- [ ] Set up monitoring/logging
- [ ] Review Row Level Security policies

## 📚 Need More Help?

- **Full Setup Guide**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Troubleshooting**: See "Troubleshooting" section in SUPABASE_SETUP.md
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)

## 🐛 Common Issues

**"Failed to fetch"**
- Check your environment variables in `.env.local`
- Restart the dev server (`npm run dev`)

**Can't sign in**
- Make sure Email provider is enabled in Supabase
- Check "Disable email confirmations" is ON for development

**Permission denied errors**
- The SQL migration might not have run correctly
- Check Supabase → Database → Tables to verify tables exist

---

**That's it!** Your app is now powered by Supabase! 🚀

