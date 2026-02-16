-- ITP Trial Onboarding tables
-- Run this in Supabase SQL Editor

-- Players table
CREATE TABLE IF NOT EXISTS onboarding_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  itp_location text NOT NULL,
  season text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Locations table
CREATE TABLE IF NOT EXISTS onboarding_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES onboarding_players(id) ON DELETE CASCADE,
  category text NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  maps_url text
);

-- Schedule entries table
CREATE TABLE IF NOT EXISTS onboarding_schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES onboarding_players(id) ON DELETE CASCADE,
  title text NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  location_category text,
  color text
);

-- Enable RLS
ALTER TABLE onboarding_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_schedule_entries ENABLE ROW LEVEL SECURITY;

-- Public read-only access (no auth required)
CREATE POLICY "Public read onboarding_players" ON onboarding_players FOR SELECT USING (true);
CREATE POLICY "Public read onboarding_locations" ON onboarding_locations FOR SELECT USING (true);
CREATE POLICY "Public read onboarding_schedule_entries" ON onboarding_schedule_entries FOR SELECT USING (true);
