import { supabase } from "@/lib/supabase";
import type { TrialProspect, CalendarEvent, ITPLocation } from "@/lib/types";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LocationsList } from "@/components/LocationsList";
import { TravelForm } from "@/components/TravelForm";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

export default async function PlayerPage({ params }: Props) {
  const { playerId } = await params;

  const { data: prospect } = await supabase
    .from("trial_prospects")
    .select("*")
    .eq("id", playerId)
    .single();

  const player = prospect as TrialProspect;
  const startDate = player.trial_start_date;
  const endDate = player.trial_end_date;

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

  const { data: locationsData } = await supabase
    .from("itp_locations")
    .select("*")
    .eq("itp_site", "Köln");

  const locations = (locationsData || []) as ITPLocation[];

  return (
    <>
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
      <TravelForm
        prospectId={playerId}
        initial={{
          arrival_date: player.arrival_date,
          arrival_time: player.arrival_time,
          flight_number: player.flight_number,
          arrival_airport: player.arrival_airport,
          needs_pickup: player.needs_pickup,
          whatsapp_number: player.whatsapp_number,
        }}
      />
      <WeeklyCalendar
        events={events}
        startDate={startDate || ""}
        endDate={endDate || ""}
      />
      <LocationsList locations={locations} />
    </>
  );
}
