import { supabase } from "@/lib/supabase";
import type { TrialProspect, CalendarEvent, ITPLocation } from "@/lib/types";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LocationsList } from "@/components/LocationsList";
import { TravelForm } from "@/components/TravelForm";
import { ContactsList } from "@/components/ContactsList";
import { WeatherForecast } from "@/components/WeatherForecast";
import { DocumentStatus } from "@/components/DocumentStatus";
import { PaymentSection } from "@/components/PaymentSection";

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

  // Fetch signed documents
  const { data: signedDocsData } = await supabase
    .from("player_documents")
    .select("document_type, document_title, signed_at, signer_name")
    .eq("player_id", playerId);

  const signedDocs = (signedDocsData || []) as { document_type: string; document_title: string; signed_at: string; signer_name: string }[];

  // Fetch ITP staff contacts
  const { data: staffContacts } = await supabase
    .from("itp_contacts")
    .select("name, role, organization, photo_url, nationality")
    .in("role", ["Project Manager", "Head of Player Development"])
    .order("name");

  const contacts = (staffContacts || []).map((c: { name: string; role?: string; organization?: string; photo_url?: string; nationality?: string }) => ({
    name: c.name,
    role: c.role || "",
    organization: c.organization,
    photo_url: c.photo_url,
    nationality: c.nationality,
  }));

  // Update housing location card for unassigned players
  if (!player.room_id) {
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
      <DocumentStatus signedDocs={signedDocs} playerId={playerId} />
      <PaymentSection
        paymentLink={player.payment_link}
        paymentAmount={player.payment_amount}
        paymentStatus={player.payment_status}
      />
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

      {/* Your Contacts */}
      <ContactsList contacts={contacts} />

      {/* Good to Know */}
      {startDate && endDate && (
        <section className="px-4 pb-8">
          <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Good to Know
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:divide-zinc-700">
            {/* Weather */}
            <WeatherForecast startDate={startDate} endDate={endDate} />

            {/* WhatsApp */}
            <a
              href={`https://wa.me/491602717912?text=${encodeURIComponent(`Hi Thomas, I'm ${player.first_name} ${player.last_name} and I'm coming for a trial at the 1.FC Köln ITP. I have a question:`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 transition-colors active:bg-zinc-50 dark:active:bg-zinc-700/50"
            >
              <span className="text-lg">💬</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Message Thomas on WhatsApp</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Questions? We&apos;re happy to help.</p>
              </div>
              <span className="text-sm text-zinc-400">→</span>
            </a>

            {/* Emergency */}
            <details>
              <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <span className="text-lg">🚨</span>
                <span className="flex-1">Emergency Information</span>
                <span className="text-xs text-zinc-400">Tap to expand</span>
              </summary>
              <div className="space-y-2 px-4 pb-4 pt-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Emergency</span>
                  <a href="tel:112" className="font-medium text-[#ED1C24]">112</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Hospital</span>
                  <a href="https://maps.google.com/?q=St.+Franziskus+Hospital+Köln" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">St. Franziskus</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Thomas</span>
                  <a href="tel:+491602717912" className="text-blue-600 dark:text-blue-400 underline">+49 160 2717912</a>
                </div>
              </div>
            </details>
          </div>
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
