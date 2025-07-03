-- Add profile_picture_url column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN profile_picture_url TEXT;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true);

-- Create storage policy for profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to profile pictures
CREATE POLICY "Profile pictures are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');
