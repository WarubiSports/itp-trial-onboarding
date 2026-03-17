import { supabase } from "@/lib/supabase";
import type { TrialProspect, CalendarEvent, ITPLocation } from "@/lib/types";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LocationsList } from "@/components/LocationsList";
import { HousingRequest } from "@/components/HousingRequest";
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
      .not("type", "in", "(language_class,recovery,airport_pickup)")
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
  }

  // Compute housing availability for unassigned players
  let housingAvailability: { house_name: string; available: number; total_beds: number }[] = [];
  let totalAvailable = 0;
  const alreadyRequestedHousing = !player.room_id && player.accommodation_type === "house";

  if (!player.room_id && startDate && endDate) {
    const [{ data: allHouses }, { data: allRooms }, { data: activePlayers }, { data: upcomingTrialists }] =
      await Promise.all([
        supabase.from("houses").select("id, name"),
        supabase.from("rooms").select("id, house_id, capacity"),
        supabase.from("players").select("id, room_id, program_start_date, program_end_date, status").eq("status", "active"),
        supabase
          .from("trial_prospects")
          .select("id, room_id, trial_start_date, trial_end_date, status")
          .in("status", ["scheduled", "in_progress"]),
      ]);

    if (allHouses && allRooms) {
      housingAvailability = allHouses.map((house) => {
        const houseRooms = allRooms.filter((r) => r.house_id === house.id || r.house_id === house.name);
        const totalBeds = houseRooms.reduce((sum, r) => sum + (r.capacity || 2), 0);
        const roomIds = new Set(houseRooms.map((r) => r.id));

        const playerCount = (activePlayers || []).filter((p) => {
          if (!p.room_id || !roomIds.has(p.room_id)) return false;
          const pStart = p.program_start_date || "2000-01-01";
          const pEnd = p.program_end_date || "2099-12-31";
          return pStart <= endDate && pEnd >= startDate;
        }).length;

        const trialistCount = (upcomingTrialists || []).filter((t) => {
          if (!t.room_id || !roomIds.has(t.room_id)) return false;
          if (!t.trial_start_date || !t.trial_end_date) return false;
          return t.trial_start_date <= endDate && t.trial_end_date >= startDate;
        }).length;

        const occupied = playerCount + trialistCount;
        return { house_name: house.name, available: Math.max(0, totalBeds - occupied), total_beds: totalBeds };
      });
      totalAvailable = housingAvailability.reduce((s, h) => s + h.available, 0);
    }

    // Update housing location card based on accommodation state
    const isHotelSuggested = player.accommodation_type === "hotel";
    locations = locations.map((loc) =>
      loc.category === "housing"
        ? {
            ...loc,
            name: isHotelSuggested
              ? "Nearby Hotel"
              : alreadyRequestedHousing
                ? "Housing Requested"
                : "Self-Organized",
            address: isHotelSuggested
              ? (player.accommodation_notes || "We recommend one of the hotels below — all within minutes of the training facility.")
              : alreadyRequestedHousing
                ? "Staff will assign your room before arrival."
                : "Request ITP housing below, or organize your own accommodation.",
            maps_url: null,
          }
        : loc
    );
  } else if (!player.room_id) {
    const isHotelSuggested = player.accommodation_type === "hotel";
    locations = locations.map((loc) =>
      loc.category === "housing"
        ? {
            ...loc,
            name: isHotelSuggested ? "Nearby Hotel" : "Self-Organized",
            address: isHotelSuggested
              ? (player.accommodation_notes || "We recommend one of the hotels below — all within minutes of the training facility.")
              : "No housing assigned yet — please organize your own accommodation.",
            maps_url: null,
          }
        : loc
    );
  }

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
        initial={player.travel_submitted_at ? {
          arrival_date: player.arrival_date,
          arrival_time: player.arrival_time,
          flight_number: player.flight_number,
          arrival_airport: player.arrival_airport,
          needs_pickup: player.needs_pickup,
          pickup_location: player.pickup_location,
          whatsapp_number: player.whatsapp_number,
        } : {}}
        firstActivity={!player.travel_arrangements && player.arrival_date ? (() => {
          const firstEvent = events.find(e => e.date >= player.arrival_date!)
          if (!firstEvent) return undefined
          const dayName = new Date(firstEvent.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
          const matched = firstEvent.location
            ? locations.find(l => firstEvent.location!.toLowerCase().includes(l.name.split(' ').pop()!.toLowerCase()) || l.name.toLowerCase().includes(firstEvent.location!.toLowerCase()))
            : null
          return {
            title: firstEvent.title,
            day: dayName,
            location: matched?.name || firstEvent.location || 'the training facility',
            address: matched?.address,
            mapsUrl: matched?.maps_url || undefined,
          }
        })() : undefined}
      />
      <WeeklyCalendar
        events={events}
        startDate={startDate || ""}
        endDate={endDate || ""}
      />
      <LocationsList locations={locations} />

      {!player.room_id && startDate && endDate && player.accommodation_type !== "hotel" && (
        <section className="px-4 pb-6">
          <HousingRequest
            prospectId={playerId}
            trialStart={startDate}
            trialEnd={endDate}
            availability={housingAvailability}
            totalAvailable={totalAvailable}
            alreadyRequested={alreadyRequestedHousing}
          />
        </section>
      )}

      <section className="px-4 pb-12">
        <h2 className={`mb-1 text-lg font-bold ${player.accommodation_type === "hotel" ? "text-[#ED1C24]" : "text-zinc-900 dark:text-zinc-50"}`}>
          {player.accommodation_type === "hotel" ? "Your Hotel Options" : "Recommended Hotels"}
        </h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          {player.accommodation_type === "hotel"
            ? "All options are within minutes of the training facility. Book directly for the best rates."
            : "Convenient options for visiting families, all near the training facility."}
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
