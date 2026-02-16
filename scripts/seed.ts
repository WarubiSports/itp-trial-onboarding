import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const PLAYER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

async function seed() {
  console.log("Seeding ITP Trial Onboarding data...\n");

  // Delete existing seed data
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
  if (playerError) throw playerError;
  console.log("Player created: Nehemiah Mason");

  // Insert locations
  const locations = [
    { category: "housing", name: "TBD", address: "To be confirmed", maps_url: null },
    {
      category: "training",
      name: "Kunstrasenplätze Salzburger Weg",
      address: "Salzburger Weg, 50858 Köln-Junkersdorf",
      maps_url: "https://maps.google.com/?q=Salzburger+Weg+50858+Köln",
    },
    {
      category: "gym",
      name: "BluePIT Lövenich",
      address: "Dieselstraße 6, 50859 Köln",
      maps_url: "https://maps.google.com/?q=Dieselstraße+6+50859+Köln",
    },
    {
      category: "language_school",
      name: "1. FC Köln Sportinternat",
      address: "Olympiaweg 3, 50933 Köln",
      maps_url: "https://maps.google.com/?q=Olympiaweg+3+50933+Köln",
    },
    {
      category: "dining",
      name: "Spoho Mensa",
      address: "Am Sportpark Müngersdorf 6, 50933 Köln",
      maps_url: "https://maps.google.com/?q=Am+Sportpark+Müngersdorf+6+50933+Köln",
    },
    {
      category: "physio",
      name: "ALC Physiolab",
      address: "Goltsteinstrasse 87a, 50968 Köln",
      maps_url: "https://maps.google.com/?q=Goltsteinstrasse+87a+50968+Köln",
    },
    { category: "train_station", name: "TBD", address: "To be confirmed", maps_url: null },
    {
      category: "leisure",
      name: "Kölner Dom",
      address: "Domkloster 4, 50667 Köln",
      maps_url: "https://maps.google.com/?q=Domkloster+4+50667+Köln",
    },
  ];

  const { error: locError } = await supabase.from("onboarding_locations").insert(
    locations.map((l) => ({ ...l, player_id: PLAYER_ID }))
  );
  if (locError) throw locError;
  console.log(`${locations.length} locations created`);

  // Insert schedule entries
  const schedule = [
    // Monday (0)
    { day_of_week: 0, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 0, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 0, title: "Gym", start_time: "14:00", end_time: "15:30", location_category: "gym", color: "#3b82f6" },
    { day_of_week: 0, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },

    // Tuesday (1)
    { day_of_week: 1, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 1, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 1, title: "German Class", start_time: "14:00", end_time: "15:30", location_category: "language_school", color: "#f97316" },
    { day_of_week: 1, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },

    // Wednesday (2)
    { day_of_week: 2, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 2, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 2, title: "Gym", start_time: "14:00", end_time: "15:30", location_category: "gym", color: "#3b82f6" },
    { day_of_week: 2, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },

    // Thursday (3)
    { day_of_week: 3, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 3, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 3, title: "German Class", start_time: "14:00", end_time: "15:30", location_category: "language_school", color: "#f97316" },
    { day_of_week: 3, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },

    // Friday (4)
    { day_of_week: 4, title: "Training", start_time: "09:00", end_time: "11:00", location_category: "training", color: "#22c55e" },
    { day_of_week: 4, title: "Lunch", start_time: "12:00", end_time: "13:00", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 4, title: "Gym", start_time: "14:00", end_time: "15:30", location_category: "gym", color: "#3b82f6" },
    { day_of_week: 4, title: "Free Time", start_time: "16:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },

    // Saturday (5)
    { day_of_week: 5, title: "Match Day", start_time: "10:00", end_time: "12:00", location_category: "training", color: "#ED1C24" },
    { day_of_week: 5, title: "Lunch", start_time: "12:30", end_time: "13:30", location_category: "dining", color: "#9ca3af" },
    { day_of_week: 5, title: "Free Time", start_time: "14:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },

    // Sunday (6) — Rest day
    { day_of_week: 6, title: "Free Time", start_time: "10:00", end_time: "18:00", location_category: null, color: "#e5e7eb" },
  ];

  const { error: schedError } = await supabase.from("onboarding_schedule_entries").insert(
    schedule.map((s) => ({ ...s, player_id: PLAYER_ID }))
  );
  if (schedError) throw schedError;
  console.log(`${schedule.length} schedule entries created`);

  console.log(`\nDone! View at: /{player_id}`);
  console.log(`Player ID: ${PLAYER_ID}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
