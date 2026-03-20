import { notFound } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Visitor, CalendarEvent, ITPLocation } from "@/lib/types";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { LocationsList } from "@/components/LocationsList";
import { VisitorTravelForm } from "@/components/VisitorTravelForm";

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

  // Fetch visitor-specific meetings + ITP team events during visit
  const [{ data: meetingsData }, { data: teamEventsData }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("visitor_id", visitorId)
      .order("date")
      .order("start_time"),
    supabase
      .from("events")
      .select("*")
      .gte("date", visitor.visit_start_date)
      .lte("date", visitor.visit_end_date)
      .not("type", "in", "(language_class,recovery,airport_pickup,school)")
      .is("visitor_id", null)
      .order("date")
      .order("start_time"),
  ]);

  // Merge and deduplicate
  const meetingIds = new Set((meetingsData || []).map((m) => m.id));
  const events = [
    ...(meetingsData || []),
    ...(teamEventsData || []).filter((e) => !meetingIds.has(e.id)),
  ].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.start_time || "").localeCompare(b.start_time || "");
  }) as CalendarEvent[];

  // Locations (skip housing — visitors don't need it)
  const { data: locationsData } = await supabase
    .from("itp_locations")
    .select("*")
    .eq("itp_site", "Köln");

  const locations = ((locationsData || []) as ITPLocation[]).filter(
    (l) => l.category !== "housing"
  );

  // Deduplicate contacts from visitor-specific meetings
  const contactMap = new Map<string, string>();
  for (const e of (meetingsData || [])) {
    if (e.contact_name) {
      contactMap.set(e.contact_name, e.contact_role || "");
    }
  }
  const contacts = Array.from(contactMap.entries()).map(([name, role]) => ({ name, role }));

  const visitRange = `${formatDate(visitor.visit_start_date)} – ${formatDate(visitor.visit_end_date)}`;

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
        initial={visitor.travel_submitted_at ? {
          arrival_date: visitor.arrival_date,
          arrival_time: visitor.arrival_time,
          flight_number: visitor.flight_number,
          arrival_airport: visitor.arrival_airport,
          needs_pickup: visitor.needs_pickup,
          pickup_location: visitor.pickup_location,
          whatsapp_number: visitor.whatsapp_number,
        } : {}}
      />

      {/* Schedule */}
      <WeeklyCalendar
        events={events}
        startDate={visitor.visit_start_date}
        endDate={visitor.visit_end_date}
      />

      {/* Your Contacts */}
      {contacts.length > 0 && (
        <section className="px-4 pb-8">
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Your Contacts
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:divide-zinc-700">
            {contacts.map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
                  <span className="text-sm font-semibold text-[#ED1C24]">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{c.name}</p>
                  {c.role && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{c.role}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Locations (no housing) */}
      <LocationsList locations={locations} />

      {/* Hotels */}
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
