/*
  # Initial schema for Lost and Found app

  1. New Tables
    - items
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - category (text)
      - status (text)
      - type (text) - 'lost' or 'found'
      - location (text)
      - date (timestamptz)
      - image_url (text)
      - user_id (uuid, foreign key)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on items table
    - Add policies for CRUD operations
*/

CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  type text NOT NULL CHECK (type IN ('lost', 'found')),
  location text NOT NULL,
  date timestamptz NOT NULL,
  image_url text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow users to read all items
CREATE POLICY "Anyone can view items"
  ON items
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own items
CREATE POLICY "Users can create items"
  ON items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own items
CREATE POLICY "Users can update own items"
  ON items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own items
CREATE POLICY "Users can delete own items"
  ON items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);