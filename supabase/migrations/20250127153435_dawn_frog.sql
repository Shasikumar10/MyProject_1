/*
  # Storage Setup Migration
  
  1. Storage Buckets
    - Creates avatars and item-images buckets if they don't exist
    - Sets up proper RLS policies for both buckets
  
  2. Security
    - Adds policies for public viewing
    - Restricts upload/update/delete to authenticated users
    - Enforces user-specific access control
*/

-- Create avatars bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  SELECT 'avatars', 'avatars', true
  WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  );
END $$;

-- Create item-images bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  SELECT 'item-images', 'item-images', true
  WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'item-images'
  );
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Avatars policies
  DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
  
  -- Item images policies
  DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own item images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own item images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Set up storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] != 'private'
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up storage policies for item-images bucket
CREATE POLICY "Anyone can view item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated users can upload item images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-images' AND
  (storage.foldername(name))[1] != 'private'
);

CREATE POLICY "Users can update their own item images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own item images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);