-- Add last_active column to users table for online status tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient querying by last_active
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active DESC);

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_active on user updates
DROP TRIGGER IF EXISTS trigger_update_last_active ON public.users;
CREATE TRIGGER trigger_update_last_active
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- Create function users can call to ping their activity
CREATE OR REPLACE FUNCTION ping_user_activity()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET last_active = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the ping function
GRANT EXECUTE ON FUNCTION ping_user_activity() TO authenticated;

COMMENT ON FUNCTION ping_user_activity() IS 'Allows authenticated users to update their last_active timestamp';



