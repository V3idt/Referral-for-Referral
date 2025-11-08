-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  reputation_score INTEGER DEFAULT 100 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  total_ratings INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referral_links table
CREATE TABLE public.referral_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL,
  referral_url TEXT NOT NULL,
  description TEXT NOT NULL,
  what_i_get TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'fulfilled')),
  total_exchanges INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exchanges table
CREATE TABLE public.exchanges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_link_id UUID REFERENCES public.referral_links(id) ON DELETE CASCADE NOT NULL,
  provider_link_id UUID REFERENCES public.referral_links(id) ON DELETE CASCADE NOT NULL,
  requester_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  proof_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rated_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rater_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  completed_their_part BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rated_user_id, rater_user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_referral_links_user_id ON public.referral_links(user_id);
CREATE INDEX idx_referral_links_status ON public.referral_links(status);
CREATE INDEX idx_exchanges_requester ON public.exchanges(requester_user_id);
CREATE INDEX idx_exchanges_provider ON public.exchanges(provider_user_id);
CREATE INDEX idx_exchanges_status ON public.exchanges(status);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_ratings_rated_user ON public.ratings(rated_user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_links_updated_at BEFORE UPDATE ON public.referral_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchanges_updated_at BEFORE UPDATE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Users: Anyone can read, users can update their own profile
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Referral Links: Anyone can read active links, users can CRUD their own
CREATE POLICY "Active referral links are viewable by everyone"
  ON public.referral_links FOR SELECT
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can insert own referral links"
  ON public.referral_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral links"
  ON public.referral_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own referral links"
  ON public.referral_links FOR DELETE
  USING (auth.uid() = user_id);

-- Exchanges: Users can see exchanges they're involved in
CREATE POLICY "Users can view their exchanges"
  ON public.exchanges FOR SELECT
  USING (auth.uid() = requester_user_id OR auth.uid() = provider_user_id);

CREATE POLICY "Users can create exchanges"
  ON public.exchanges FOR INSERT
  WITH CHECK (auth.uid() = requester_user_id);

CREATE POLICY "Users can update their exchanges"
  ON public.exchanges FOR UPDATE
  USING (auth.uid() = requester_user_id OR auth.uid() = provider_user_id);

-- Messages: Users can see messages they sent or received
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Ratings: Users can see ratings for anyone, but can only create their own
CREATE POLICY "Ratings are viewable by everyone"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_user_id);

-- Create storage bucket for proof images
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-images', 'proof-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for proof images
CREATE POLICY "Anyone can view proof images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-images');

CREATE POLICY "Authenticated users can upload proof images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proof-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own proof images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'proof-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own proof images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'proof-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

