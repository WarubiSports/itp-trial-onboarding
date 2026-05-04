import { supabase } from "@/lib/supabase";
import { getPlayerEvents } from "@/lib/getPlayerEvents";
import type { TrialProspect, CalendarEvent, ITPLocation } from "@/lib/types";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LocationsList } from "@/components/LocationsList";
import { TravelForm } from "@/components/TravelForm";
import { ContactsList } from "@/components/ContactsList";
import { WeatherForecast } from "@/components/WeatherForecast";
import { DocumentStatus } from "@/components/DocumentStatus";
import { PaymentSection } from "@/components/PaymentSection";
import { ProgramView } from "@/components/views/ProgramView";
import { CommittedView } from "@/components/views/CommittedView";
import { AlumniView } from "@/components/views/AlumniView";
import { ClosedView } from "@/components/views/ClosedView";
import { resolvePlayer, derivePhase } from "@/lib/resolvePlayer";
import { sortContacts, STAFF_LOCATION_NAMES } from "@/lib/sortContacts";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

export default async function PlayerPage({ params }: Props) {
  const { playerId } = await params;

  // Route by phase: trial / committed / in-program each get a dedicated view.
  const resolved = await resolvePlayer(playerId);
  if (!resolved) notFound();

  const phase = derivePhase(resolved);

  if (phase === "in-program") {
    const rawPlayer = resolved.raw as { status?: string; alumni_destination?: string | null };
    if (rawPlayer.status === "alumni") {
      return (
        <AlumniView
          player={resolved.data}
          alumniDestination={rawPlayer.alumni_destination ?? null}
        />
      );
    }
    return <ProgramView player={resolved.data} />;
  }

  if (phase === "committed") {
    return <CommittedView prospect={resolved.raw as TrialProspect} />;
  }

  // Rejected / withdrawn prospects — show a farewell view instead of a
  // stale trial page with a past schedule and orphaned signing UI.
  const trialStatus = (resolved.raw as { status?: string }).status;
  if (trialStatus === "rejected" || trialStatus === "withdrawn") {
    return <ClosedView player={resolved.data} reason={trialStatus} />;
  }

  // Below: trial phase — existing trial prospect flow, unchanged.
  const prospect = resolved.raw;

  const player = prospect as TrialProspect;
  const startDate = player.trial_start_date;
  const endDate = player.trial_end_date;
  const playerProgram = resolved.data.program ?? null;
  const isFutures = playerProgram === "warubi_futures";
  const programLabel = isFutures ? "Warubi Futures" : "1.FC Köln ITP";
  const periodWord = isFutures ? "intake" : "trial";

  let events: CalendarEvent[] = [];
  if (startDate && endDate) {
    events = await getPlayerEvents({ startDate, endDate, phase: "trial", program: playerProgram });
  }

  // Futures players see only their training venue (and housing if arranged
   // for them). The wider ITP location set (FC Köln Office, BluePIT, Spoho)
   // is irrelevant to a 10-day intake.
  let locations: ITPLocation[];
  if (isFutures) {
    const futTraining: ITPLocation = {
      id: 'fut-training',
      name: 'SV Lövenich/Widdersdorf 1986/27 e.V.',
      address: 'Neue Sandkaul 21, 50859 Köln',
      maps_url: 'https://www.google.com/maps/search/?api=1&query=SV+L%C3%B6venich+Widdersdorf+Neue+Sandkaul+21+50859+K%C3%B6ln',
      category: 'training',
      itp_site: 'Köln',
    } as ITPLocation;
    const housingArranged = player.accommodation_type === 'housing_provided';
    locations = housingArranged
      ? [
          futTraining,
          {
            id: 'fut-housing',
            name: 'Player House',
            address: 'Neue Sandkaul 84, 50859 Köln-Widdersdorf',
            maps_url: 'https://www.google.com/maps/search/?api=1&query=Neue+Sandkaul+84+50859+K%C3%B6ln',
            category: 'housing',
            itp_site: 'Köln',
          } as ITPLocation,
        ]
      : [futTraining];
  } else {
    const { data: locationsData } = await supabase
      .from("itp_locations")
      .select("*")
      .eq("itp_site", "Köln")
      .not("name", "in", `(${STAFF_LOCATION_NAMES.map((n) => `"${n}"`).join(",")})`);

    locations = (locationsData || []) as ITPLocation[];
  }

  // Override housing location based on room assignment (ITP only — Futures
  // already resolved above and doesn't use the rooms/houses tables).
  if (!isFutures && player.room_id) {
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
    .in("role", ["Project Manager", "Project Manager / Coach", "Head of Player Development", "Head of Methodology"])
    .order("name");

  const contacts = sortContacts(staffContacts || []).map((c: { name: string; role?: string; organization?: string; photo_url?: string; nationality?: string }) => ({
    name: c.name,
    role: c.role || "",
    organization: c.organization,
    photo_url: c.photo_url,
    nationality: c.nationality,
  }));

  // Update housing location card for unassigned ITP players (FUT handled above).
  // accommodation_type === 'house' means we're hosting them in academy housing,
  // even before a specific room is assigned.
  if (!isFutures && !player.room_id) {
    const isHotelSuggested = player.accommodation_type === "hotel";
    const isAcademyHosted = player.accommodation_type === "house";
    locations = locations.map((loc) =>
      loc.category === "housing"
        ? {
            ...loc,
            name: isAcademyHosted
              ? "Player Housing — Widdersdorf"
              : isHotelSuggested
                ? "Nearby Hotel"
                : "Self-Organized",
            address: isAcademyHosted
              ? (player.accommodation_notes || "You'll be staying in our player housing in Widdersdorf. Your specific house and room will be confirmed before arrival.")
              : isHotelSuggested
                ? (player.accommodation_notes || "We recommend one of the hotels below — all within minutes of the training facility.")
                : "No housing assigned yet — please organize your own accommodation.",
            maps_url: null,
          }
        : loc
    );
  }

  const academyHosted = !isFutures && (!!player.room_id || player.accommodation_type === "house");

  return (
    <>
      {player.travel_arrangements && (
        <section className="px-4 pb-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-700/30 bg-amber-900/20 p-4">
            <span className="mt-0.5 text-lg">🚐</span>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                Pick-up
              </p>
              <p className="text-sm text-amber-300">
                {player.travel_arrangements}
              </p>
            </div>
          </div>
        </section>
      )}
      <DocumentStatus
        signedDocs={signedDocs}
        playerId={playerId}
        prospectCreatedAt={player.created_at}
      />
      <PaymentSection
        paymentLink={player.payment_link}
        paymentAmount={player.payment_amount}
        paymentStatus={player.payment_status}
      />
      <TravelForm
        prospectId={playerId}
        submittedAt={player.travel_submitted_at}
        initial={player.travel_submitted_at ? {
          arrival_date: player.arrival_date,
          arrival_time: player.arrival_time,
          flight_number: player.flight_number,
          arrival_airport: player.arrival_airport,
          needs_pickup: player.needs_pickup,
          pickup_location: player.pickup_location,
          whatsapp_number: player.whatsapp_number,
        } : {}}
        firstActivity={!player.travel_arrangements ? (() => {
          const training = locations.find(l => l.category === 'training')

          // Find first training event AFTER arrival, with 3-hour buffer
          // (travel + check-in + rest needed before they can train)
          let dayLabel = 'your first day'
          if (player.arrival_date) {
            const arrivalTime = player.arrival_time || '00:00'
            const arrivalMs = new Date(`${player.arrival_date}T${arrivalTime}:00`).getTime()
            const bufferMs = 3 * 60 * 60 * 1000

            const trainingEvent = events.find((e) => {
              if (e.type !== 'team_training' && e.type !== 'training') return false
              if (!e.start_time) return false
              const eventStartMs = new Date(e.start_time).getTime()
              return eventStartMs >= arrivalMs + bufferMs
            })

            if (trainingEvent) {
              const evDate = new Date(trainingEvent.date + 'T00:00:00')
              const arrivalDay = new Date(player.arrival_date + 'T00:00:00')
              const dayDiff = Math.round(
                (evDate.getTime() - arrivalDay.getTime()) / (1000 * 60 * 60 * 24)
              )
              if (dayDiff === 0) dayLabel = 'your first day'
              else if (dayDiff === 1) dayLabel = 'your second day'
              else dayLabel = `day ${dayDiff + 1}`

              const time = new Date(trainingEvent.start_time!).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Berlin',
              })
              dayLabel = `${dayLabel} at ${time}`
            }
          }

          return {
            title: 'Team Training',
            day: dayLabel,
            location: training?.name || 'Sportpark Widdersdorf',
            address: training?.address,
            mapsUrl: training?.maps_url || undefined,
          }
        })() : undefined}
      />
      {startDate && endDate && events.length > 0 && (
        <WeeklyCalendar
          events={events}
          startDate={startDate}
          endDate={endDate}
        />
      )}
      <LocationsList locations={locations} />

      {/* Your Contacts */}
      <ContactsList contacts={contacts} />

      {/* Good to Know */}
      {startDate && endDate && (
        <section className="px-4 pb-8">
          <h2 className="mb-3 text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)]">
            Good to Know
          </h2>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
            {/* Weather */}
            <WeatherForecast startDate={startDate} endDate={endDate} />

            {/* WhatsApp */}
            <a
              href={`https://wa.me/491602717912?text=${encodeURIComponent(`Hi Thomas, I'm ${player.first_name} ${player.last_name} and I'm coming for a ${periodWord} at the ${programLabel}. I have a question:`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 transition-colors active:bg-[var(--color-surface-elevated)]"
            >
              <span className="text-lg">💬</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">Message Thomas on WhatsApp</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Questions? We&apos;re happy to help.</p>
              </div>
              <span className="text-sm text-[var(--color-text-muted)]">→</span>
            </a>

            {/* Emergency */}
            <details>
              <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-medium text-[var(--color-text)]">
                <span className="text-lg">🚨</span>
                <span className="flex-1">Emergency Information</span>
                <span className="text-xs text-[var(--color-text-muted)]">Tap to expand</span>
              </summary>
              <div className="space-y-2 px-4 pb-4 pt-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Emergency</span>
                  <a href="tel:112" className="font-medium text-[var(--color-brand)]">112</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Hospital</span>
                  <a href="https://maps.google.com/?q=St.+Franziskus+Hospital+Köln" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">St. Franziskus</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Thomas</span>
                  <a href="tel:+491602717912" className="text-blue-400 underline">+49 160 2717912</a>
                </div>
              </div>
            </details>
          </div>
        </section>
      )}

      {!academyHosted && (
      <section className="px-4 pb-12">
        <h2 className={`mb-1 text-lg font-bold font-[family-name:var(--font-outfit)] ${player.accommodation_type === "hotel" ? "text-[var(--color-brand)]" : "text-[var(--color-text)]"}`}>
          {player.accommodation_type === "hotel" ? "Your Hotel Options" : "Recommended Hotels"}
        </h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          {player.accommodation_type === "hotel"
            ? "All options are within minutes of the training facility. Book directly for the best rates."
            : "Convenient options for visiting families, all near the training facility."}
        </p>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
            <a href="https://dorint.com/en/hotel-near-the-rheinenergie-stadium" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4">
              <span className="text-lg">🏨</span>
              <span className="flex-1 font-medium text-[var(--color-text)]">Essential by Dorint Junkersdorf</span>
              <span className="text-sm font-medium text-[var(--color-brand)]">→</span>
            </a>
            <a href="https://www.garten-hotel.de/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4">
              <span className="text-lg">🏨</span>
              <span className="flex-1 font-medium text-[var(--color-text)]">Garten-Hotel Ponick</span>
              <span className="text-sm font-medium text-[var(--color-brand)]">→</span>
            </a>
            <a href="https://www.leonardo-hotels.com/cologne/leonardo-royal-hotel-koln-am-stadtwald" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4">
              <span className="text-lg">🏨</span>
              <span className="flex-1 font-medium text-[var(--color-text)]">Leonardo Royal Hotel Köln — Am Stadtwald</span>
              <span className="text-sm font-medium text-[var(--color-brand)]">→</span>
            </a>
          </div>
        </div>
      </section>
      )}
    </>
  );
}
