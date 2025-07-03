-- Create daily_updates table for messages and photos
CREATE TABLE daily_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  message TEXT,
  photo_url TEXT,
  update_type VARCHAR(50) DEFAULT 'general', -- 'general', 'meal', 'nap', 'activity', 'milestone', 'concern'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create storage bucket for daily update photos
INSERT INTO storage.buckets (id, name, public) VALUES ('daily-updates', 'daily-updates', true);

-- Enable Row Level Security
ALTER TABLE daily_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_updates
CREATE POLICY "Users can view own daily updates" ON daily_updates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily updates" ON daily_updates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily updates" ON daily_updates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily updates" ON daily_updates FOR DELETE USING (auth.uid() = user_id);

-- Create storage policies for daily update photos
CREATE POLICY "Users can upload their own daily update photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'daily-updates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own daily update photos" ON storage.objects
FOR SELECT USING (bucket_id = 'daily-updates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own daily update photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'daily-updates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own daily update photos" ON storage.objects
FOR DELETE USING (bucket_id = 'daily-updates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to daily update photos
CREATE POLICY "Daily update photos are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'daily-updates');

-- Create index for better performance
CREATE INDEX idx_daily_updates_user_date ON daily_updates(user_id, date DESC);
CREATE INDEX idx_daily_updates_created_at ON daily_updates(created_at DESC);
