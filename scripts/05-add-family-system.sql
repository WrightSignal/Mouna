-- Add user_role column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN user_role VARCHAR(20) DEFAULT 'nanny' CHECK (user_role IN ('parent', 'nanny'));

-- Create families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  family_code VARCHAR(10) UNIQUE NOT NULL, -- Short code for easy sharing
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create family_members table (junction table for users and families)
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'nanny')),
  hourly_rate DECIMAL(5,2), -- Family-specific hourly rate for nannies
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique user-family combinations
  UNIQUE(family_id, user_id)
);

-- Create family invitations table
CREATE TABLE family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'nanny')),
  hourly_rate DECIMAL(5,2), -- Proposed hourly rate for nannies
  invitation_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Function to generate unique family codes
CREATE OR REPLACE FUNCTION generate_family_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  -- Generate 6-character code
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate family code if not provided
CREATE OR REPLACE FUNCTION set_family_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_code IS NULL OR NEW.family_code = '' THEN
    LOOP
      NEW.family_code := generate_family_code();
      -- Check if code already exists
      IF NOT EXISTS (SELECT 1 FROM families WHERE family_code = NEW.family_code) THEN
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  -- Generate 12-character invitation code
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate family codes
CREATE TRIGGER trigger_set_family_code
  BEFORE INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION set_family_code();

-- Trigger to auto-generate invitation codes
CREATE OR REPLACE FUNCTION set_invitation_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_code IS NULL OR NEW.invitation_code = '' THEN
    LOOP
      NEW.invitation_code := generate_invitation_code();
      IF NOT EXISTS (SELECT 1 FROM family_invitations WHERE invitation_code = NEW.invitation_code) THEN
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invitation_code
  BEFORE INSERT ON family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_code();

-- Enable Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for families table
CREATE POLICY "Users can view families they belong to" ON families FOR SELECT 
USING (
  id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid() AND is_active = TRUE
  )
);

CREATE POLICY "Parents can create families" ON families FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM user_profiles 
    WHERE user_role = 'parent'
  )
);

CREATE POLICY "Family members can update their families" ON families FOR UPDATE 
USING (
  id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid() AND is_active = TRUE
  )
);

-- RLS Policies for family_members table
CREATE POLICY "Users can view family members of their families" ON family_members FOR SELECT 
USING (
  family_id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid() AND is_active = TRUE
  )
);

CREATE POLICY "Parents can add members to their families" ON family_members FOR INSERT 
WITH CHECK (
  family_id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid() AND role = 'parent' AND is_active = TRUE
  )
);

CREATE POLICY "Users can update their own family membership" ON family_members FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for family_invitations table
CREATE POLICY "Users can view invitations for their families" ON family_invitations FOR SELECT 
USING (
  family_id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid() AND is_active = TRUE
  )
  OR invited_email = auth.email()
);

CREATE POLICY "Parents can create invitations for their families" ON family_invitations FOR INSERT 
WITH CHECK (
  family_id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid() AND role = 'parent' AND is_active = TRUE
  )
);

CREATE POLICY "Users can update invitations they created or received" ON family_invitations FOR UPDATE 
USING (
  invited_by = auth.uid() 
  OR invited_email = auth.email()
);

-- Update existing RLS policies to work with family system
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;

DROP POLICY IF EXISTS "Users can view own mileage entries" ON mileage_entries;
DROP POLICY IF EXISTS "Users can insert own mileage entries" ON mileage_entries;
DROP POLICY IF EXISTS "Users can update own mileage entries" ON mileage_entries;

DROP POLICY IF EXISTS "Users can view own daily updates" ON daily_updates;
DROP POLICY IF EXISTS "Users can insert own daily updates" ON daily_updates;
DROP POLICY IF EXISTS "Users can update own daily updates" ON daily_updates;
DROP POLICY IF EXISTS "Users can delete own daily updates" ON daily_updates;

-- Create new family-aware policies for time_entries
CREATE POLICY "Family members can view time entries within their families" ON time_entries FOR SELECT 
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT fm1.user_id FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm2.user_id = auth.uid() AND fm1.is_active = TRUE AND fm2.is_active = TRUE
  )
);

CREATE POLICY "Users can insert their own time entries" ON time_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time entries" ON time_entries FOR UPDATE 
USING (auth.uid() = user_id);

-- Create new family-aware policies for mileage_entries
CREATE POLICY "Family members can view mileage entries within their families" ON mileage_entries FOR SELECT 
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT fm1.user_id FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm2.user_id = auth.uid() AND fm1.is_active = TRUE AND fm2.is_active = TRUE
  )
);

CREATE POLICY "Users can insert their own mileage entries" ON mileage_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mileage entries" ON mileage_entries FOR UPDATE 
USING (auth.uid() = user_id);

-- Create new family-aware policies for daily_updates
CREATE POLICY "Family members can view daily updates within their families" ON daily_updates FOR SELECT 
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT fm1.user_id FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm2.user_id = auth.uid() AND fm1.is_active = TRUE AND fm2.is_active = TRUE
  )
);

CREATE POLICY "Users can insert their own daily updates" ON daily_updates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily updates" ON daily_updates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily updates" ON daily_updates FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_active ON family_members(is_active);
CREATE INDEX idx_family_invitations_family_id ON family_invitations(family_id);
CREATE INDEX idx_family_invitations_email ON family_invitations(invited_email);
CREATE INDEX idx_family_invitations_code ON family_invitations(invitation_code);
CREATE INDEX idx_families_code ON families(family_code); 