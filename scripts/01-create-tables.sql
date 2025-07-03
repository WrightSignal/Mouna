-- Create user profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  hourly_rate DECIMAL(5,2),
  pto_balance_vacation DECIMAL(4,1) DEFAULT 0,
  pto_balance_sick DECIMAL(4,1) DEFAULT 0,
  pto_balance_personal DECIMAL(4,1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create time entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  clock_in TIMESTAMP,
  clock_out TIMESTAMP,
  break_duration INTEGER DEFAULT 0, -- minutes
  manual_entry BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create mileage entries table
CREATE TABLE mileage_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE,
  miles DECIMAL(6,2),
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  purpose VARCHAR(255),
  rate_per_mile DECIMAL(4,3) DEFAULT 0.67, -- IRS standard rate
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create scheduled shifts table (for Phase 2)
CREATE TABLE scheduled_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  recurring_pattern VARCHAR(50), -- 'weekly', 'none'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create PTO requests table (for Phase 2)
CREATE TABLE pto_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  pto_type VARCHAR(20), -- 'vacation', 'sick', 'personal'
  hours_requested DECIMAL(4,1),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own time entries" ON time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own time entries" ON time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON time_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mileage entries" ON mileage_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mileage entries" ON mileage_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mileage entries" ON mileage_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scheduled shifts" ON scheduled_shifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheduled shifts" ON scheduled_shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled shifts" ON scheduled_shifts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own PTO requests" ON pto_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PTO requests" ON pto_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own PTO requests" ON pto_requests FOR UPDATE USING (auth.uid() = user_id);
