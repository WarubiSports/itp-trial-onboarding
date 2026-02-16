-- Refactored ITP Trial Onboarding
-- Drops standalone tables, creates shared itp_locations table
-- Uses existing trial_prospects + calendar_events tables

-- Drop old standalone tables
DROP TABLE IF EXISTS onboarding_schedule_entries;
DROP TABLE IF EXISTS onboarding_locations;
DROP TABLE IF EXISTS onboarding_players;

-- Shared locations per ITP site (not per player)
CREATE TABLE IF NOT EXISTS itp_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itp_site text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'housing', 'training', 'gym', 'language_school',
    'dining', 'physio', 'train_station', 'leisure'
  )),
  name text NOT NULL,
  address text NOT NULL,
  maps_url text,
  created_at timestamptz DEFAULT now()
);

-- RLS: public read
ALTER TABLE itp_locations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read itp_locations') THEN
    CREATE POLICY "Public read itp_locations" ON itp_locations FOR SELECT USING (true);
  END IF;
END $$;

-- Seed Köln locations
INSERT INTO itp_locations (itp_site, category, name, address, maps_url) VALUES
  ('Köln', 'housing', 'TBD', 'To be confirmed', NULL),
  ('Köln', 'training', 'Kunstrasenplätze Salzburger Weg', 'Salzburger Weg, 50858 Köln-Junkersdorf', 'https://maps.google.com/?q=Salzburger+Weg+50858+Köln'),
  ('Köln', 'gym', 'BluePIT Lövenich', 'Dieselstraße 6, 50859 Köln', 'https://maps.google.com/?q=Dieselstraße+6+50859+Köln'),
  ('Köln', 'language_school', '1. FC Köln Sportinternat', 'Olympiaweg 3, 50933 Köln', 'https://maps.google.com/?q=Olympiaweg+3+50933+Köln'),
  ('Köln', 'dining', 'Spoho Mensa', 'Am Sportpark Müngersdorf 6, 50933 Köln', 'https://maps.google.com/?q=Am+Sportpark+Müngersdorf+6+50933+Köln'),
  ('Köln', 'physio', 'ALC Physiolab', 'Goltsteinstrasse 87a, 50968 Köln', 'https://maps.google.com/?q=Goltsteinstrasse+87a+50968+Köln'),
  ('Köln', 'train_station', 'TBD', 'To be confirmed', NULL),
  ('Köln', 'leisure', 'Kölner Dom', 'Domkloster 4, 50667 Köln', 'https://maps.google.com/?q=Domkloster+4+50667+Köln')
ON CONFLICT DO NOTHING;
