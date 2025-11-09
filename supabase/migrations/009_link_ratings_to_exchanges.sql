-- Add exchange_id to ratings table to link each rating to a specific exchange
-- This allows users to rate each other multiple times (once per exchange)

-- First, drop the old unique constraint
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_rated_user_id_rater_user_id_key;

-- Add exchange_id column (nullable for now, to handle existing ratings)
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS exchange_id UUID REFERENCES exchanges(id) ON DELETE CASCADE;

-- Create new unique constraint: one rating per exchange (per rater)
-- This allows the same two users to rate each other multiple times, once per exchange
ALTER TABLE ratings ADD CONSTRAINT ratings_exchange_id_rater_user_id_key 
  UNIQUE(exchange_id, rater_user_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_ratings_exchange_id ON ratings(exchange_id);

-- Update the reputation calculation trigger to handle multiple ratings per user pair
-- (The existing trigger already handles this correctly by counting ALL ratings)

