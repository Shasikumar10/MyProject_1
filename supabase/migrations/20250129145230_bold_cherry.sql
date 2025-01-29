/*
  # Fix Comments and Profiles Relationship

  1. Changes
    - Add foreign key relationship between comments and profiles
    - Add proper error handling for null values
    - Update comments table structure

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Add user_id foreign key to comments table
ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_user_id_fkey,
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add profiles relationship to comments
ALTER TABLE comments
ADD CONSTRAINT comments_user_profiles_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Update comments table to handle null values better
ALTER TABLE comments
ALTER COLUMN content SET NOT NULL,
ALTER COLUMN item_id SET NOT NULL,
ALTER COLUMN user_id SET NOT NULL;