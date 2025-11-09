-- Function to automatically update user reputation when a rating is created
CREATE OR REPLACE FUNCTION update_user_reputation_on_rating()
RETURNS TRIGGER AS $$
DECLARE
  total_positive INTEGER;
  total_negative INTEGER;
  total INTEGER;
  new_score INTEGER;
BEGIN
  -- Count positive and negative ratings for the rated user
  SELECT 
    COUNT(*) FILTER (WHERE completed_their_part = true),
    COUNT(*) FILTER (WHERE completed_their_part = false),
    COUNT(*)
  INTO total_positive, total_negative, total
  FROM ratings
  WHERE rated_user_id = NEW.rated_user_id;
  
  -- Calculate new reputation score
  -- Start at 100, add 5 for each positive rating, subtract 10 for each negative
  new_score := 100 + (total_positive * 5) - (total_negative * 10);
  
  -- Clamp between 0 and 100
  new_score := GREATEST(0, LEAST(100, new_score));
  
  -- Update the user's reputation (this runs with definer privileges, bypassing RLS)
  UPDATE users
  SET 
    reputation_score = new_score,
    total_ratings = total,
    updated_at = NOW()
  WHERE id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs after a rating is inserted
CREATE TRIGGER update_reputation_after_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_reputation_on_rating();

-- Function for deleting ratings (define before trigger that uses it)
CREATE OR REPLACE FUNCTION update_user_reputation_on_rating_delete()
RETURNS TRIGGER AS $$
DECLARE
  total_positive INTEGER;
  total_negative INTEGER;
  total INTEGER;
  new_score INTEGER;
BEGIN
  -- Count positive and negative ratings for the rated user
  SELECT 
    COUNT(*) FILTER (WHERE completed_their_part = true),
    COUNT(*) FILTER (WHERE completed_their_part = false),
    COUNT(*)
  INTO total_positive, total_negative, total
  FROM ratings
  WHERE rated_user_id = OLD.rated_user_id;
  
  -- Calculate new reputation score
  new_score := 100 + (total_positive * 5) - (total_negative * 10);
  new_score := GREATEST(0, LEAST(100, new_score));
  
  -- Update the user's reputation
  UPDATE users
  SET 
    reputation_score = new_score,
    total_ratings = total,
    updated_at = NOW()
  WHERE id = OLD.rated_user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update reputation when a rating is deleted (in case ratings are ever removed)
CREATE TRIGGER update_reputation_after_rating_delete
  AFTER DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_reputation_on_rating_delete();

