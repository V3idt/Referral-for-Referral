-- Add admin features to the application

-- 1. Add is_admin and is_banned columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 2. Add deleted_by column to referral_links (soft delete)
ALTER TABLE public.referral_links
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- 3. Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON public.users(is_banned) WHERE is_banned = TRUE;
CREATE INDEX IF NOT EXISTS idx_referral_links_deleted ON public.referral_links(deleted_at) WHERE deleted_at IS NOT NULL;

-- 4. Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to ban a user (admin only)
CREATE OR REPLACE FUNCTION ban_user(
  target_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the current user ID
  admin_id := auth.uid();
  
  -- Check if current user is admin
  IF NOT is_user_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;
  
  -- Ban the user
  UPDATE public.users
  SET 
    is_banned = TRUE,
    banned_at = NOW(),
    banned_by = admin_id,
    ban_reason = reason
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to unban a user (admin only)
CREATE OR REPLACE FUNCTION unban_user(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  admin_id UUID;
BEGIN
  admin_id := auth.uid();
  
  IF NOT is_user_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can unban users';
  END IF;
  
  UPDATE public.users
  SET 
    is_banned = FALSE,
    banned_at = NULL,
    banned_by = NULL,
    ban_reason = NULL
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to delete a referral link (admin only)
CREATE OR REPLACE FUNCTION admin_delete_referral_link(
  link_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  admin_id UUID;
BEGIN
  admin_id := auth.uid();
  
  IF NOT is_user_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can delete referral links';
  END IF;
  
  UPDATE public.referral_links
  SET 
    deleted_at = NOW(),
    deleted_by = admin_id,
    delete_reason = reason
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update RLS policies to exclude banned users

-- Drop existing policies for referral_links
DROP POLICY IF EXISTS "Active referral links are viewable by everyone" ON public.referral_links;
DROP POLICY IF EXISTS "Users can insert own referral links" ON public.referral_links;

-- Recreate with banned user check
CREATE POLICY "Active referral links are viewable by everyone"
  ON public.referral_links FOR SELECT
  USING (
    (status = 'active' OR user_id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can insert own referral links"
  ON public.referral_links FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

-- 9. Add policy for admins to view all links (including deleted)
CREATE POLICY "Admins can view all referral links"
  ON public.referral_links FOR SELECT
  USING (is_user_admin(auth.uid()));

-- 10. Add policy for admins to update any link
CREATE POLICY "Admins can update any referral link"
  ON public.referral_links FOR UPDATE
  USING (is_user_admin(auth.uid()));

-- 11. Add policy for admins to delete any link
CREATE POLICY "Admins can delete any referral link"
  ON public.referral_links FOR DELETE
  USING (is_user_admin(auth.uid()));

-- 12. Prevent banned users from creating messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

-- 13. Create admin activity log table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_link_id UUID REFERENCES public.referral_links(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for admin actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- RLS for admin_actions (only admins can view)
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions"
  ON public.admin_actions FOR SELECT
  USING (is_user_admin(auth.uid()));

CREATE POLICY "Admins can insert admin actions"
  ON public.admin_actions FOR INSERT
  WITH CHECK (is_user_admin(auth.uid()));

-- 14. Create trigger to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_banned = TRUE AND (OLD.is_banned IS NULL OR OLD.is_banned = FALSE) THEN
    INSERT INTO public.admin_actions (admin_id, action_type, target_user_id, reason)
    VALUES (NEW.banned_by, 'ban_user', NEW.id, NEW.ban_reason);
  ELSIF NEW.is_banned = FALSE AND OLD.is_banned = TRUE THEN
    INSERT INTO public.admin_actions (admin_id, action_type, target_user_id)
    VALUES (auth.uid(), 'unban_user', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_ban_actions
  AFTER UPDATE ON public.users
  FOR EACH ROW
  WHEN (OLD.is_banned IS DISTINCT FROM NEW.is_banned)
  EXECUTE FUNCTION log_admin_action();

-- 15. Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION ban_user TO authenticated;
GRANT EXECUTE ON FUNCTION unban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_referral_link TO authenticated;

COMMENT ON COLUMN public.users.is_admin IS 'Whether the user has admin privileges';
COMMENT ON COLUMN public.users.is_banned IS 'Whether the user is banned from the platform';
COMMENT ON FUNCTION ban_user IS 'Admin function to ban a user';
COMMENT ON FUNCTION unban_user IS 'Admin function to unban a user';
COMMENT ON FUNCTION admin_delete_referral_link IS 'Admin function to delete a referral link';


