import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { TrialProspect, CalendarEvent, ITPLocation } from "@/lib/types";
import { WelcomeHeader } from "@/components/WelcomeHeader";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LocationsList } from "@/components/LocationsList";

type Props = {
  params: Promise<{ playerId: string }>;
};

export default async function PlayerPage({ params }: Props) {
  const { playerId } = await params;

  // Look up trial prospect from existing ITP table
  const { data: prospect, error } = await supabase
    .from("trial_prospects")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error || !prospect) {
    notFound();
  }

  const player = prospect as TrialProspect;

  // Determine trial date range
  const startDate = player.trial_start_date;
  const endDate = player.trial_end_date;

  // Fetch calendar events for the trial period
  let events: CalendarEvent[] = [];
  if (startDate && endDate) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .not("type", "in", "(language_class,recovery)")
      .order("date")
      .order("start_time");
    events = (data || []) as CalendarEvent[];
  }

  // Fetch ITP site locations (Köln for now)
  const { data: locationsData } = await supabase
    .from("itp_locations")
    .select("*")
    .eq("itp_site", "Köln");

  const locations = (locationsData || []) as ITPLocation[];

  return (
    <main className="mx-auto min-h-screen max-w-lg pb-safe">
      <WelcomeHeader prospect={player} />
      {player.travel_arrangements && (
        <section className="px-4 pb-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
            <span className="mt-0.5 text-lg">🚐</span>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Pick-up
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {player.travel_arrangements}
              </p>
            </div>
          </div>
        </section>
      )}
      <WeeklyCalendar
        events={events}
        startDate={startDate || ""}
        endDate={endDate || ""}
      />
      <LocationsList locations={locations} />
    </main>
  );
}
