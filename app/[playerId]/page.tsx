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

  let locations = (locationsData || []) as ITPLocation[];

  // Override housing location based on room assignment
  if (player.room_id) {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("name, house_id")
      .eq("id", player.room_id)
      .single();

    if (roomData) {
      const { data: houseData } = await supabase
        .from("houses")
        .select("name, address, maps_url")
        .eq("id", roomData.house_id)
        .single();

      if (houseData) {
        locations = locations.map((loc) =>
          loc.category === "housing"
            ? {
                ...loc,
                name: `${houseData.name} — ${roomData.name}`,
                address: houseData.address || "Player House",
                maps_url: houseData.maps_url || loc.maps_url,
              }
            : loc
        );
      }
    }
  } else {
    // No room assigned — show self-organized housing
    locations = locations.map((loc) =>
      loc.category === "housing"
        ? {
            ...loc,
            name: "Self-Organized",
            address: "No housing assigned yet — please organize your own accommodation.",
            maps_url: null,
          }
        : loc
    );
  }

  return (
    <>
      {player.travel_arrangements ? (
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
      ) : player.arrival_date && (() => {
        const firstEvent = events.find(e => e.date >= player.arrival_date!)
        if (!firstEvent) return null
        const dayName = new Date(firstEvent.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
        const locationName = firstEvent.location || 'the training facility'
        return (
          <section className="px-4 pb-6">
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
              <span className="mt-0.5 text-lg">📍</span>
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  Arrival
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  No pick-up organized. Please make your own way to {locationName} for <strong>{firstEvent.title}</strong> on {dayName}.
                </p>
              </div>
            </div>
          </section>
        )
      })()}
      <TravelForm
        prospectId={playerId}
        initial={player.travel_submitted_at ? {
          arrival_date: player.arrival_date,
          arrival_time: player.arrival_time,
          flight_number: player.flight_number,
          arrival_airport: player.arrival_airport,
          needs_pickup: player.needs_pickup,
          whatsapp_number: player.whatsapp_number,
        } : {}}
      />
      <WeeklyCalendar
        events={events}
        startDate={startDate || ""}
        endDate={endDate || ""}
      />
      <LocationsList locations={locations} />

      <section className="px-4 pb-12">
        <h2 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Recommended Hotels
        </h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Convenient options for visiting families, all near the training facility.
        </p>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:divide-zinc-700">
            <a href="https://hotel-koeln-junkersdorf.dorint.com/en/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4">
              <span className="text-lg">🏨</span>
              <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-100">Essential by Dorint Junkersdorf</span>
              <span className="text-sm font-medium text-[#ED1C24]">→</span>
            </a>
            <a href="https://www.garten-hotel.de/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4">
              <span className="text-lg">🏨</span>
              <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-100">Garten-Hotel Ponick</span>
              <span className="text-sm font-medium text-[#ED1C24]">→</span>
            </a>
            <a href="https://www.leonardo-hotels.com/cologne/leonardo-royal-hotel-koln-am-stadtwald" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4">
              <span className="text-lg">🏨</span>
              <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-100">Leonardo Royal Hotel Köln — Am Stadtwald</span>
              <span className="text-sm font-medium text-[#ED1C24]">→</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
