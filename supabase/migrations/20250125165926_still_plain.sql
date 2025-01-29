/*
  # Add Student Profiles and Item Claims

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `student_id` (text)
      - `department` (text)
      - `phone` (text)
      - `year_of_study` (int)
      - `avatar_url` (text)
      
    - `item_claims`
      - `id` (uuid, primary key)
      - `item_id` (uuid, references items)
      - `claimed_by` (uuid, references auth.users)
      - `claim_date` (timestamptz)
      - `proof_of_ownership` (text)
      - `status` (text: pending/approved/rejected)
      - `admin_notes` (text)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  student_id text UNIQUE,
  department text,
  phone text,
  year_of_study int,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create item_claims table
CREATE TABLE IF NOT EXISTS item_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  claimed_by uuid REFERENCES auth.users(id),
  claim_date timestamptz DEFAULT now(),
  proof_of_ownership text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE item_claims ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Item claims policies
CREATE POLICY "Users can view claims for their items"
  ON item_claims
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM items WHERE id = item_id
    ) OR
    auth.uid() = claimed_by
  );

CREATE POLICY "Users can create claims"
  ON item_claims
  FOR INSERT
  WITH CHECK (auth.uid() = claimed_by);

CREATE POLICY "Item owners can update claim status"
  ON item_claims
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM items WHERE id = item_id
    )
  );

-- Function to handle profile updates
CREATE OR REPLACE FUNCTION handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profile updates
CREATE TRIGGER profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_update();