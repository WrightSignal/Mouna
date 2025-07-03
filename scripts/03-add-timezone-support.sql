-- Add timezone column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN timezone TEXT DEFAULT 'America/New_York';

-- Update existing profiles to have a default timezone if they don't have one
UPDATE user_profiles SET timezone = 'America/New_York' WHERE timezone IS NULL;
