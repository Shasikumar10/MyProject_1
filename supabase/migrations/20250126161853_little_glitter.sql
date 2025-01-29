/*
  # Add storage policies for item images

  1. Changes
    - Create storage bucket for item images
    - Add RLS policies for storage bucket access
    - Allow authenticated users to upload images
    - Allow public read access to images
*/

-- Enable storage by creating the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true);

-- Set up storage policies
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-images' AND
  (storage.foldername(name))[1] != 'private'
);

CREATE POLICY "Allow users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'item-images' AND auth.uid() = owner);

CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid() = owner);