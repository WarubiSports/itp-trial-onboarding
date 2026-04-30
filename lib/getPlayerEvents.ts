import { supabase } from "./supabase";
import type { CalendarEvent } from "./types";

type Phase = "trial" | "program";
type Program = "itp_men" | "itp_women" | "warubi_futures";

type Args = {
  startDate: string;
  endDate: string;
  phase: Phase;
  program?: Program | null;
};

/**
 * Canonical query for events that should appear on a player's calendar.
 *
 * IMPORTANT — do not query the events table directly from a player-facing
 * page. Always go through this helper. The events table is shared across
 * players, visitors (parents, agents), and program scopes; without the
 * filters below, unrelated itineraries leak across pages.
 *
 * Filters applied:
 *   - visitor_id IS NULL    — excludes visitor itineraries (regression
 *                              fix Apr 2026: Junero's agent visit was
 *                              leaking onto Jadon's trial calendar)
 *   - program scope         — generic (NULL) events plus the player's own
 *                              program (itp_men, itp_women, or warubi_futures)
 *   - type exclusions       — language class, recovery, airport pickup
 *                              are never shown; program phase also
 *                              excludes trial-only event types
 *
 * Visitor pages have their own query in app/visitor/[visitorId]/page.tsx
 * that filters BY visitor_id — keep that one separate by design.
 */
export async function getPlayerEvents({
  startDate,
  endDate,
  phase,
  program,
}: Args): Promise<CalendarEvent[]> {
  const excludes = [
    "language_class",
    "recovery",
    "airport_pickup",
    ...(phase === "program" ? ["trial", "prospect_trial"] : []),
  ];

  const programFilter = program
    ? `program.is.null,program.eq.${program}`
    : "program.is.null";

  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .not("type", "in", `(${excludes.join(",")})`)
    .is("visitor_id", null)
    .or(programFilter)
    .order("date")
    .order("start_time");

  return (data || []) as CalendarEvent[];
}
