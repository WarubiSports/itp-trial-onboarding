import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY required in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Use a fixed UUID for the test trial prospect
const PROSPECT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

async function seed() {
  console.log("Seeding test trial prospect + calendar events...\n");

  // Clean existing test data
  await supabase.from("events").delete().eq("description", "TRIAL_SEED_DATA");
  await supabase.from("trial_prospects").delete().eq("id", PROSPECT_ID);

  // Create trial prospect
  const { error: prospectError } = await supabase.from("trial_prospects").insert({
    id: PROSPECT_ID,
    first_name: "Nehemiah",
    last_name: "Mason",
    date_of_birth: "2007-03-15",
    position: "CM",
    nationality: "USA",
    current_club: "FC Dallas Academy",
    trial_start_date: "2026-03-02",
    trial_end_date: "2026-03-08",
    status: "scheduled",
  });
  if (prospectError) throw prospectError;
  console.log("  Trial prospect: Nehemiah Mason (Mar 2-8, 2026)");

  // Create calendar events for trial week (ISO timestamps with Berlin timezone)
  const tz = "+01:00"; // CET (March = winter time)
  const events = [
    // Monday Mar 2
    { date: "2026-03-02", title: "Training", start_time: `2026-03-02T09:00:00${tz}`, end_time: `2026-03-02T11:00:00${tz}`, type: "team_training", location: "Salzburger Weg" },
    { date: "2026-03-02", title: "Lunch", start_time: `2026-03-02T12:00:00${tz}`, end_time: `2026-03-02T13:00:00${tz}`, type: "other", location: "Spoho Mensa" },
    { date: "2026-03-02", title: "Gym", start_time: `2026-03-02T14:00:00${tz}`, end_time: `2026-03-02T15:30:00${tz}`, type: "gym", location: "BluePIT Lövenich" },

    // Tuesday Mar 3
    { date: "2026-03-03", title: "Training", start_time: `2026-03-03T09:00:00${tz}`, end_time: `2026-03-03T11:00:00${tz}`, type: "team_training", location: "Salzburger Weg" },
    { date: "2026-03-03", title: "Lunch", start_time: `2026-03-03T12:00:00${tz}`, end_time: `2026-03-03T13:00:00${tz}`, type: "other", location: "Spoho Mensa" },
    { date: "2026-03-03", title: "German Class", start_time: `2026-03-03T14:00:00${tz}`, end_time: `2026-03-03T15:30:00${tz}`, type: "language_class", location: "Sportinternat" },

    // Wednesday Mar 4
    { date: "2026-03-04", title: "Training", start_time: `2026-03-04T09:00:00${tz}`, end_time: `2026-03-04T11:00:00${tz}`, type: "team_training", location: "Salzburger Weg" },
    { date: "2026-03-04", title: "Lunch", start_time: `2026-03-04T12:00:00${tz}`, end_time: `2026-03-04T13:00:00${tz}`, type: "other", location: "Spoho Mensa" },
    { date: "2026-03-04", title: "Gym", start_time: `2026-03-04T14:00:00${tz}`, end_time: `2026-03-04T15:30:00${tz}`, type: "gym", location: "BluePIT Lövenich" },

    // Thursday Mar 5
    { date: "2026-03-05", title: "Training", start_time: `2026-03-05T09:00:00${tz}`, end_time: `2026-03-05T11:00:00${tz}`, type: "team_training", location: "Salzburger Weg" },
    { date: "2026-03-05", title: "Lunch", start_time: `2026-03-05T12:00:00${tz}`, end_time: `2026-03-05T13:00:00${tz}`, type: "other", location: "Spoho Mensa" },
    { date: "2026-03-05", title: "German Class", start_time: `2026-03-05T14:00:00${tz}`, end_time: `2026-03-05T15:30:00${tz}`, type: "language_class", location: "Sportinternat" },

    // Friday Mar 6
    { date: "2026-03-06", title: "Training", start_time: `2026-03-06T09:00:00${tz}`, end_time: `2026-03-06T11:00:00${tz}`, type: "team_training", location: "Salzburger Weg" },
    { date: "2026-03-06", title: "Lunch", start_time: `2026-03-06T12:00:00${tz}`, end_time: `2026-03-06T13:00:00${tz}`, type: "other", location: "Spoho Mensa" },
    { date: "2026-03-06", title: "Gym", start_time: `2026-03-06T14:00:00${tz}`, end_time: `2026-03-06T15:30:00${tz}`, type: "gym", location: "BluePIT Lövenich" },

    // Saturday Mar 7
    { date: "2026-03-07", title: "Match Day", start_time: `2026-03-07T10:00:00${tz}`, end_time: `2026-03-07T12:00:00${tz}`, type: "match", location: "Salzburger Weg" },
    { date: "2026-03-07", title: "Lunch", start_time: `2026-03-07T12:30:00${tz}`, end_time: `2026-03-07T13:30:00${tz}`, type: "other", location: "Spoho Mensa" },

    // Sunday Mar 8
    // Rest day — no events
  ];

  const { error: eventsError } = await supabase.from("events").insert(
    events.map((e) => ({ ...e, all_day: false, description: "TRIAL_SEED_DATA" }))
  );
  if (eventsError) throw eventsError;
  console.log(`  ${events.length} calendar events (Mar 2-8)`);

  console.log(`\nDone! Test URL: /<app>/a1b2c3d4-e5f6-7890-abcd-ef1234567890`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
