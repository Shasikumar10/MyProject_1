/*
  # Fix Notification System Relationships

  1. Changes
    - Add proper foreign key relationships for notifications
    - Update queries to use correct join syntax
    - Add missing indexes for performance

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Add foreign key relationship between notifications and profiles
ALTER TABLE notifications
ADD CONSTRAINT notifications_actor_profiles_fkey
FOREIGN KEY (actor_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add foreign key relationship between messages and profiles
ALTER TABLE messages
ADD CONSTRAINT messages_sender_profiles_fkey
FOREIGN KEY (sender_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);