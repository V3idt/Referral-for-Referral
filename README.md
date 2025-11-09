# Referral-for-Referral

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

A modern web application for exchanging referral links with verified users. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, and **Supabase**.

[Demo](#) • [Documentation](./SUPABASE_SETUP.md) • [Contributing](./CONTRIBUTING.md)

</div>

---

## Features

- 🔗 Browse and share referral links
- 💬 **Real-time messaging** with proof sharing
- ⭐ Trust score and reputation system
- 🤝 Exchange tracking and management
- 🔐 **Secure authentication** with Supabase Auth
- 🌙 Dark mode support
- 📱 Fully responsive design
- ✨ Beautiful UI with animations
- 🚀 **Production-ready** with Row Level Security

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account (free tier available)

### Installation

#### 1. **Clone or navigate to the project**:
```bash
cd Referral-for-Referral
```

#### 2. **Install dependencies**:
```bash
npm install
```

#### 3. **Set up Supabase** (5 minutes):

1. Create a project at [https://app.supabase.com](https://app.supabase.com)
2. Go to **SQL Editor** in your project dashboard
3. Run the SQL script from `supabase/migrations/001_initial_schema.sql`
4. Go to **Settings** → **API** and copy:
   - Project URL
   - anon public key

**📖 Detailed Setup**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for full instructions

#### 4. **Add environment variables**:

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### 5. **Run the development server**:
```bash
npm run dev
```

#### 6. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

🎉 **Done!** Sign up to create your account and start exchanging referral links!

## Project Structure

```
Referral-for-Referral/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Home page (browse links)
│   ├── my-links/            # My referral links page
│   ├── messages/            # Messaging page
│   ├── exchanges/           # Exchange management page
│   ├── layout.tsx           # Root layout
│   ├── providers.tsx        # React Query & Toast providers
│   └── globals.css          # Global styles
├── components/
│   ├── referrals/           # Referral-specific components
│   │   ├── ReferralCard.tsx
│   │   ├── ExchangeDialog.tsx
│   │   └── AddLinkDialog.tsx
│   ├── ui/                  # shadcn/ui components
│   └── LayoutWrapper.tsx    # Main layout with sidebar
├── lib/
│   ├── base44Client.ts      # Base44 SDK client (configure this!)
│   └── utils.ts             # Utility functions
└── Entities/                # Base44 entity schemas (for reference)
    ├── ReferralLink.json
    ├── Exchange.json
    ├── Message.json
    ├── Rating.json
    └── User.json
```

## 🗄️ Database Schema

The application uses Supabase (PostgreSQL) with the following tables:

### Tables Overview

- **users**: User profiles with reputation scores
- **referral_links**: User referral links
- **exchanges**: Exchange tracking between users
- **messages**: Direct messaging with real-time support
- **ratings**: User ratings/reviews

All tables have **Row Level Security (RLS)** enabled for data protection.

**📖 Full Schema**: See `supabase/migrations/001_initial_schema.sql`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Customization

### Colors

The app uses an emerald/teal color scheme. To change:

1. Edit `components/LayoutWrapper.tsx` CSS variables
2. Update gradient classes throughout the app

### Adding Pages

1. Create a new folder in `app/` with `page.tsx`
2. Add route to `lib/utils.ts` in `createPageUrl()`
3. Add navigation item to `components/LayoutWrapper.tsx`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

Build the project:
```bash
npm run build
```

The output will be in the `.next` folder, then follow your hosting platform's Next.js deployment guide.

## 🔒 Security Features

✅ **Row Level Security (RLS)**: All database operations are secured  
✅ **Supabase Auth**: Industry-standard authentication  
✅ **Secure file uploads**: User-isolated storage  
✅ **Environment validation**: Catches missing config at startup  
✅ **Real-time permissions**: Live data updates with security

## 📱 Key Features

- **Real-time Messaging**: See new messages instantly
- **Trust System**: User reputation scores based on completed exchanges
- **Proof Sharing**: Upload screenshots to verify referral sign-ups
- **Exchange Tracking**: Monitor all your referral exchanges
- **Dark Mode**: Full dark mode support with system detection

## 📚 Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Complete Supabase setup guide
- [Next.js docs](https://nextjs.org/docs) - Next.js documentation
- [Supabase docs](https://supabase.com/docs) - Supabase documentation
- [shadcn/ui docs](https://ui.shadcn.com) - UI components documentation

## 🆘 Support

For issues with:
- **Supabase**: Check [Supabase docs](https://supabase.com/docs) or [Discord](https://discord.supabase.com)
- **Next.js**: Check [Next.js docs](https://nextjs.org/docs)
- **Application**: Open an issue on GitHub

## License

MIT License - feel free to use this project as a template!
