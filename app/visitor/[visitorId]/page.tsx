import { notFound } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Visitor, CalendarEvent } from "@/lib/types";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { VisitorTravelForm } from "@/components/VisitorTravelForm";
import { ContactsList } from "@/components/ContactsList";
import { WeatherForecast } from "@/components/WeatherForecast";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ visitorId: string }>;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const roleLabels: Record<string, string> = {
  agent: "Agent",
  coach: "Coach",
  partner: "Partner",
  parent: "Parent",
  scout: "Scout",
};

export default async function VisitorPage({ params }: Props) {
  const { visitorId } = await params;

  const { data: visitorData, error } = await supabase
    .from("visitors")
    .select("*")
    .eq("id", visitorId)
    .single();

  if (error || !visitorData) {
    notFound();
  }

  const visitor = visitorData as Visitor;

  // Fetch only visitor-specific events (created via schedule planner)
  const { data: meetingsData } = await supabase
    .from("events")
    .select("*")
    .eq("visitor_id", visitorId)
    .order("date")
    .order("start_time");

  const events = (meetingsData || []) as CalendarEvent[];

  // Fetch contacts for photo lookup — collect from both contact_ids array and legacy contact_id
  const contactIds = (meetingsData || []).flatMap((m) => {
    const ids: string[] = [];
    if (m.contact_ids && Array.isArray(m.contact_ids)) ids.push(...m.contact_ids);
    else if (m.contact_id) ids.push(m.contact_id);
    return ids;
  }).filter(Boolean);

  const { data: contactsData } = contactIds.length > 0
    ? await supabase
        .from("itp_contacts")
        .select("id, name, role, organization, photo_url, nationality")
        .in("id", [...new Set(contactIds)])
    : { data: [] };

  const contactLookup = new Map(
    (contactsData || []).map((c: { id: string; name: string; role?: string; organization?: string; photo_url?: string; nationality?: string }) => [c.id, c])
  );

  // Deduplicate contacts from visitor-specific meetings (prefer itp_contacts data for photo)
  const contactMap = new Map<string, { name: string; role: string; organization?: string; photo_url?: string; nationality?: string }>();
  for (const e of (meetingsData || [])) {
    // Handle contact_ids array (new) and contact_id (legacy)
    const ids = (e.contact_ids && Array.isArray(e.contact_ids) && e.contact_ids.length > 0)
      ? e.contact_ids
      : e.contact_id ? [e.contact_id] : [];

    for (const id of ids) {
      if (contactLookup.has(id)) {
        const c = contactLookup.get(id)!;
        if (!contactMap.has(c.name)) {
          contactMap.set(c.name, { name: c.name, role: c.role || "", organization: c.organization, photo_url: c.photo_url, nationality: c.nationality });
        }
      }
    }
    // Fallback to text fields if no structured contacts
    if (ids.length === 0 && e.contact_name && !contactMap.has(e.contact_name)) {
      contactMap.set(e.contact_name, { name: e.contact_name, role: e.contact_role || "" });
    }
  }
  const contacts = Array.from(contactMap.values());

  const visitRange = visitor.visit_start_date === visitor.visit_end_date
    ? formatDate(visitor.visit_start_date)
    : `${formatDate(visitor.visit_start_date)} – ${formatDate(visitor.visit_end_date)}`;

  return (
    <main className="mx-auto min-h-screen max-w-lg pb-safe">
      {/* Welcome Header */}
      <section className="flex flex-col items-center gap-3 pb-6 pt-8 text-center">
        <Image
          src="/warubi-fc-logo.png"
          alt="Warubi Sports x 1. FC Köln"
          width={240}
          height={60}
          priority
        />
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Welcome to the 1. FC Köln Bundesliga ITP
        </h1>
        <div className="flex flex-col gap-0.5">
          <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            {visitor.first_name} {visitor.last_name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {visitor.organization && `${visitor.organization} · `}
            {roleLabels[visitor.role] || visitor.role}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Visit: {visitRange}
          </p>
        </div>
      </section>

      {/* Travel arrangements banner (set by staff) */}
      {visitor.travel_arrangements && (
        <section className="px-4 pb-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
            <span className="mt-0.5 text-lg">🚐</span>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Pick-up
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {visitor.travel_arrangements}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Travel Form */}
      <VisitorTravelForm
        visitorId={visitorId}
        initial={{
          arrival_date: visitor.arrival_date,
          arrival_time: visitor.arrival_time,
          flight_number: visitor.flight_number,
          arrival_airport: visitor.arrival_airport,
          needs_pickup: visitor.needs_pickup,
          pickup_location: visitor.pickup_location,
          whatsapp_number: visitor.whatsapp_number,
        }}
      />

      {/* Schedule */}
      <WeeklyCalendar
        events={events}
        startDate={visitor.visit_start_date}
        endDate={visitor.visit_end_date}
        contactLookup={Object.fromEntries(contactLookup)}
      />

      {/* Your Contacts */}
      <ContactsList contacts={contacts} />

      {/* Weather */}
      <WeatherForecast startDate={visitor.visit_start_date} endDate={visitor.visit_end_date} />

      {/* WhatsApp Contact */}
      <section className="px-4 pb-8">
        <a
          href="https://wa.me/491602717912?text=Hi%20Thomas%2C%20I%27m%20visiting%20the%201.%20FC%20K%C3%B6ln%20ITP%20and%20have%20a%20question."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 transition-colors active:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:active:bg-green-900/40"
        >
          <span className="text-2xl">💬</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-green-900 dark:text-green-100">
              Message Thomas on WhatsApp
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Thomas Ellinger · Warubi Sports
            </p>
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">→</span>
        </a>
      </section>

      {/* Emergency Info */}
      <section className="px-4 pb-8">
        <details className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            🚨 Emergency Information
          </summary>
          <div className="space-y-3 border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-700">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Emergency Number</p>
              <a href="tel:112" className="text-sm text-[#ED1C24] font-medium">112</a>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Police, Fire & Ambulance (free, works from any phone)</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Nearest Hospital</p>
              <a href="https://maps.google.com/?q=St.+Franziskus+Hospital+Köln" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 underline">
                St. Franziskus Hospital
              </a>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Schönsteinstraße 63, 50825 Köln</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Your Contact</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">Thomas Ellinger</p>
              <a href="tel:+491602717912" className="text-sm text-blue-600 dark:text-blue-400 underline">+49 160 2717912</a>
            </div>
          </div>
        </details>
      </section>

      <section className="px-4 pb-12">
        <h2 className="mb-1 text-lg font-bold text-[#ED1C24]">
          Your Hotel Options
        </h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          All options are within minutes of the training facility. Book directly for the best rates.
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
    </main>
  );
}
