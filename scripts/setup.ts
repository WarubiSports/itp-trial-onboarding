import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required. Add it to .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  db: { schema: "public" },
});

async function runSQL(sql: string) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

const PLAYER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

async function setup() {
  console.log("Setting up ITP Trial Onboarding...\n");

  // Create tables via direct SQL using the pg endpoint
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS onboarding_players (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      itp_location text NOT NULL,
      season text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS onboarding_locations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES onboarding_players(id) ON DELETE CASCADE,
      category text NOT NULL,
      name text NOT NULL,
      address text NOT NULL,
      maps_url text
    );

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

    ALTER TABLE onboarding_players ENABLE ROW LEVEL SECURITY;
    ALTER TABLE onboarding_locations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE onboarding_schedule_entries ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read onboarding_players') THEN
        CREATE POLICY "Public read onboarding_players" ON onboarding_players FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read onboarding_locations') THEN
        CREATE POLICY "Public read onboarding_locations" ON onboarding_locations FOR SELECT USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read onboarding_schedule_entries') THEN
        CREATE POLICY "Public read onboarding_schedule_entries" ON onboarding_schedule_entries FOR SELECT USING (true);
      END IF;
    END $$;
  `;

  // Try running SQL via the Supabase SQL API
  const sqlRes = await fetch(`${supabaseUrl}/pg/query`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: schemaSQL }),
  });

  if (!sqlRes.ok) {
    console.log("Direct SQL API not available, trying alternative...");

    // Try via the /sql endpoint
    const sqlRes2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ sql: schemaSQL }),
    });

    if (!sqlRes2.ok) {
      console.log("\n⚠ Cannot create tables via API.");
      console.log("Please run the following SQL in your Supabase SQL Editor:");
      console.log("File: scripts/schema.sql\n");
      console.log("Then re-run this script to seed data.\n");

      // Check if tables exist by trying a query
      const { error } = await supabase.from("onboarding_players").select("id").limit(1);
      if (error) {
        console.log("Tables don't exist yet. Create them first via SQL Editor.");
        process.exit(1);
      }
      console.log("Tables exist! Proceeding to seed...\n");
    }
  } else {
    console.log("Schema created successfully!");
  }

  // Seed data
  console.log("Seeding data...");

  // Clean existing
  await supabase.from("onboarding_schedule_entries").delete().eq("player_id", PLAYER_ID);
  await supabase.from("onboarding_locations").delete().eq("player_id", PLAYER_ID);
  await supabase.from("onboarding_players").delete().eq("id", PLAYER_ID);

  // Insert player
  const { error: playerError } = await supabase.from("onboarding_players").insert({
    id: PLAYER_ID,
    name: "Nehemiah Mason",
    itp_location: "Köln",
    season: "2025/26",
  });
  if (playerError) {
    console.error("Failed to create player:", playerError.message);
    process.exit(1);
  }
  console.log("  Player: Nehemiah Mason");

  // Locations
  const locations = [
    { category: "housing", name: "TBD", address: "To be confirmed", maps_url: null },
    { category: "training", name: "Kunstrasenplätze Salzburger Weg", address: "Salzburger Weg, 50858 Köln-Junkersdorf", maps_url: "https://maps.google.com/?q=Salzburger+Weg+50858+Köln" },
    { category: "gym", name: "BluePIT Lövenich", address: "Dieselstraße 6, 50859 Köln", maps_url: "https://maps.google.com/?q=Dieselstraße+6+50859+Köln" },
    { category: "language_school", name: "1. FC Köln Sportinternat", address: "Olympiaweg 3, 50933 Köln", maps_url: "https://maps.google.com/?q=Olympiaweg+3+50933+Köln" },
    { category: "dining", name: "Spoho Mensa", address: "Am Sportpark Müngersdorf 6, 50933 Köln", maps_url: "https://maps.google.com/?q=Am+Sportpark+Müngersdorf+6+50933+Köln" },
    { category: "physio", name: "ALC Physiolab", address: "Goltsteinstrasse 87a, 50968 Köln", maps_url: "https://maps.google.com/?q=Goltsteinstrasse+87a+50968+Köln" },
    { category: "train_station", name: "TBD", address: "To be confirmed", maps_url: null },
    { category: "leisure", name: "Kölner Dom", address: "Domkloster 4, 50667 Köln", maps_url: "https://maps.google.com/?q=Domkloster+4+50667+Köln" },
  ];

  const { error: locError } = await supabase.from("onboarding_locations").insert(
    locations.map((l) => ({ ...l, player_id: PLAYER_ID }))
  );
  if (locError) {
    console.error("Failed to create locations:", locError.message);
    process.exit(1);
  }
  console.log(`  ${locations.length} locations`);

  // Schedule
  const schedule = [
    { day_of_week: 0, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 0, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 0, title: "Gym", start_time: "14:00", end_time: "15:30", location_category: "gym", color: "#3b82f6" },
    { day_of_week: 0, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },
    { day_of_week: 1, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 1, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 1, title: "German Class", start_time: "14:00", end_time: "15:30", location_category: "language_school", color: "#f97316" },
    { day_of_week: 1, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },
    { day_of_week: 2, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 2, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 2, title: "Gym", start_time: "14:00", end_time: "15:30", location_category: "gym", color: "#3b82f6" },
    { day_of_week: 2, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },
    { day_of_week: 3, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 3, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 3, title: "German Class", start_time: "14:00", end_time: "15:30", location_category: "language_school", color: "#f97316" },
    { day_of_week: 3, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },
    { day_of_week: 4, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 4, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 4, title: "Gym", start_time: "14:00", end_time: "15:30", location_category: "gym", color: "#3b82f6" },
    { day_of_week: 4, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },
    { day_of_week: 5, title: "Match Day", start_time: "10:00", end_time: "12:00", location_category: "training", color: "#ED1C24" },
    { day_of_week: 5, title: "Lunch", start_time: "12:30", end_time: "13:30", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 5, title: "Free Time", start_time: "14:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },
    { day_of_week: 6, title: "Free Time", start_time: "10:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },
  ];

  const { error: schedError } = await supabase.from("onboarding_schedule_entries").insert(
    schedule.map((s) => ({ ...s, player_id: PLAYER_ID }))
  );
  if (schedError) {
    console.error("Failed to create schedule:", schedError.message);
    process.exit(1);
  }
  console.log(`  ${schedule.length} schedule entries`);

  console.log(`\nDone! Access at: /<app-url>/${PLAYER_ID}`);
}

setup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
