import { supabase } from "@/lib/supabase";
import { getPlayerEvents } from "@/lib/getPlayerEvents";
import type { CalendarEvent, ITPLocation } from "@/lib/types";
import type { PlayerRecord } from "@/lib/resolvePlayer";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LocationsList } from "@/components/LocationsList";
import { ContactsList } from "@/components/ContactsList";
import { WeatherForecast } from "@/components/WeatherForecast";
import { PaymentSection } from "@/components/PaymentSection";
import { sortContacts, STAFF_LOCATION_NAMES } from "@/lib/sortContacts";

type Props = {
  player: PlayerRecord;
};

/**
 * In-program player view. Same components as the trial view, pulling data
 * from the `players` table. Sections tuned for someone who's already in
 * the program: no document signing, no hotel recommendations (they have
 * program housing), no travel form.
 */
export const ProgramView = async ({ player }: Props) => {
  const startDate = player.start_date;
  const endDate = player.end_date;

  // Schedule — only if program dates set
  let events: CalendarEvent[] = [];
  if (startDate && endDate) {
    events = await getPlayerEvents({
      startDate,
      endDate,
      phase: "program",
      program: player.program ?? null,
    });
  }

  // Locations (Köln site) — exclude staff-only working locations
  const { data: locationsData } = await supabase
    .from("itp_locations")
    .select("*")
    .eq("itp_site", "Köln")
    .not("name", "in", `(${STAFF_LOCATION_NAMES.map((n) => `"${n}"`).join(",")})`);

  let locations = (locationsData || []) as ITPLocation[];

  // Override housing with actual house/room if assigned
  if (player.room_id) {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("name, house_id")
      .eq("id", player.room_id)
      .maybeSingle();

    if (roomData) {
      const { data: houseData } = await supabase
        .from("houses")
        .select("name, address, maps_url")
        .eq("id", roomData.house_id)
        .maybeSingle();

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
  } else if (player.housing_notes) {
    locations = locations.map((loc) =>
      loc.category === "housing"
        ? { ...loc, name: "Housing", address: player.housing_notes || "", maps_url: null }
        : loc
    );
  }

  // ITP staff contacts
  const { data: staffContacts } = await supabase
    .from("itp_contacts")
    .select("name, role, organization, photo_url, nationality")
    .in("role", [
      "Project Manager",
      "Project Manager / Coach",
      "Head of Player Development",
      "Head of Methodology",
      "Coach",
    ])
    .order("name");

  const contacts = sortContacts(staffContacts || []).map(
    (c: {
      name: string;
      role?: string;
      organization?: string;
      photo_url?: string;
      nationality?: string;
    }) => ({
      name: c.name,
      role: c.role || "",
      organization: c.organization,
      photo_url: c.photo_url,
      nationality: c.nationality,
    })
  );

  const firstName = player.first_name;
  const lastName = player.last_name;

  return (
    <>
      <PaymentSection
        paymentLink={player.payment_link}
        paymentAmount={player.payment_amount}
        paymentStatus={player.payment_status}
      />

      {startDate && endDate && events.length > 0 && (
        <WeeklyCalendar events={events} startDate={startDate} endDate={endDate} />
      )}

      <LocationsList locations={locations} />
      <ContactsList contacts={contacts} />

      {startDate && endDate && (
        <section className="px-4 pb-8">
          <h2 className="mb-3 text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)]">
            Good to Know
          </h2>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
            <WeatherForecast startDate={startDate} endDate={endDate} />

            <a
              href={`https://wa.me/491602717912?text=${encodeURIComponent(
                `Hi Thomas, I'm ${firstName} ${lastName} and I'm in the 1.FC Köln ITP. I have a question:`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 transition-colors active:bg-[var(--color-surface-elevated)]"
            >
              <span className="text-lg">💬</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Message Thomas on WhatsApp
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Questions? We&apos;re happy to help.
                </p>
              </div>
              <span className="text-sm text-[var(--color-text-muted)]">→</span>
            </a>

            <details>
              <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-medium text-[var(--color-text)]">
                <span className="text-lg">🚨</span>
                <span className="flex-1">Emergency Information</span>
                <span className="text-xs text-[var(--color-text-muted)]">Tap to expand</span>
              </summary>
              <div className="space-y-2 px-4 pb-4 pt-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Emergency</span>
                  <a href="tel:112" className="font-medium text-[var(--color-brand)]">
                    112
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Hospital</span>
                  <a
                    href="https://maps.google.com/?q=St.+Franziskus+Hospital+Köln"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    St. Franziskus
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Thomas</span>
                  <a href="tel:+491602717912" className="text-blue-400 underline">
                    +49 160 2717912
                  </a>
                </div>
              </div>
            </details>
          </div>
        </section>
      )}

    </>
  );
};
