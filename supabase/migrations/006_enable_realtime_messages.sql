-- Enable Realtime for messages table
-- This allows instant WebSocket updates when messages are sent/received

-- Enable Realtime replication for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Note: Indexes already exist from initial schema (001_initial_schema.sql)
-- idx_messages_sender on sender_id
-- idx_messages_receiver on receiver_id
-- idx_messages_created_at on created_at

