-- Add metadata column to messages table for storing action buttons and exchange context
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries on metadata
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON public.messages USING GIN (metadata);

-- Add comment for documentation
COMMENT ON COLUMN public.messages.metadata IS 'Stores additional message data like exchange_id, actions, proof_status, etc.';

