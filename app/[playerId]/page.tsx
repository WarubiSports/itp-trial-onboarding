import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Player, Location, ScheduleEntry } from "@/lib/types";
import { WelcomeHeader } from "@/components/WelcomeHeader";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LocationsList } from "@/components/LocationsList";

type Props = {
  params: Promise<{ playerId: string }>;
};

export default async function PlayerPage({ params }: Props) {
  const { playerId } = await params;

  const [playerRes, locationsRes, scheduleRes] = await Promise.all([
    supabase
      .from("onboarding_players")
      .select("*")
      .eq("id", playerId)
      .single(),
    supabase
      .from("onboarding_locations")
      .select("*")
      .eq("player_id", playerId),
    supabase
      .from("onboarding_schedule_entries")
      .select("*")
      .eq("player_id", playerId)
      .order("day_of_week")
      .order("start_time"),
  ]);

  if (playerRes.error || !playerRes.data) {
    notFound();
  }

  const player = playerRes.data as Player;
  const locations = (locationsRes.data || []) as Location[];
  const entries = (scheduleRes.data || []) as ScheduleEntry[];

  return (
    <main className="mx-auto min-h-screen max-w-lg pb-safe">
      <WelcomeHeader player={player} />
      <WeeklyCalendar entries={entries} locations={locations} />
      <LocationsList locations={locations} />
    </main>
  );
}
