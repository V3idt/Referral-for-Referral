-- Add username field and make it unique

-- 1. Add username column (separate from full_name)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- 3. Migrate existing full_name data to username (if any)
-- This converts full_name to lowercase username for existing users
UPDATE public.users
SET username = LOWER(REGEXP_REPLACE(full_name, '[^a-zA-Z0-9]', '', 'g'))
WHERE username IS NULL AND full_name IS NOT NULL;

-- 4. Create function to check username availability
CREATE OR REPLACE FUNCTION is_username_available(check_username TEXT, exclude_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF exclude_user_id IS NULL THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.users WHERE LOWER(username) = LOWER(check_username)
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE LOWER(username) = LOWER(check_username) 
      AND id != exclude_user_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update the auto-create profile trigger to handle username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from metadata or generate from email
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Clean username (alphanumeric only, lowercase)
  new_username := LOWER(REGEXP_REPLACE(new_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure username is unique by appending number if needed
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := new_username || counter::TEXT;
  END LOOP;
  
  INSERT INTO public.users (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    new_username
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, do nothing
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION is_username_available TO authenticated;

-- 7. Add RLS policy for username updates (users can update their own)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON COLUMN public.users.username IS 'Unique username for the user';
COMMENT ON FUNCTION is_username_available IS 'Check if a username is available';
