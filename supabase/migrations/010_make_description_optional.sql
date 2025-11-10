-- Make description field optional in referral_links table
-- This allows users to post referral links without specifying offer details

ALTER TABLE referral_links 
  ALTER COLUMN description DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN referral_links.description IS 'What others get when using this referral link (optional)';

