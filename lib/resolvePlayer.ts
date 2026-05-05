import { supabase } from "@/lib/supabase";
import type { TrialProspect } from "@/lib/types";

/**
 * A player record, normalized to the common fields the app displays.
 * The raw data is preserved under `raw` for source-specific rendering.
 */
export type PlayerRecord = {
  id: string;
  first_name: string;
  last_name: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  accommodation_type?: string | null;
  accommodation_notes?: string | null;
  housing_notes?: string | null;
  room_id?: string | null;
  arrival_date?: string | null;
  arrival_time?: string | null;
  arrival_airport?: string | null;
  flight_number?: string | null;
  needs_pickup?: boolean | null;
  pickup_location?: string | null;
  whatsapp_number?: string | null;
  travel_arrangements?: string | null;
  travel_submitted_at?: string | null;
  onboarding_completed_at?: string | null;
  scout_id?: string | null;
  payment_link?: string | null;
  payment_amount?: string | null;
  payment_status?: string | null;
  date_of_birth: string;
  program?: "itp_men" | "itp_women" | "warubi_futures" | null;
  gender?: "male" | "female" | null;
};

export type ResolvedPlayer =
  | { source: "player"; data: PlayerRecord; raw: Record<string, unknown> }
  | { source: "prospect"; data: PlayerRecord; raw: TrialProspect };

/**
 * The three player-facing phases in the men's ITP journey. Drives which
 * info-page layout to render.
 *
 * - trial: pre-acceptance (coming for a tryout). Sees trial schedule, hotels,
 *   document signing, travel form.
 * - committed: accepted but not yet promoted. Sees preseason prep items:
 *   payment, passport uploads, U18 legal forms, housing assignment status.
 *   Hotel recommendations and trial schedule hidden.
 * - in-program: promoted to players. Sees the full ProgramView.
 */
export type Phase = "trial" | "committed" | "in-program";

export function derivePhase(resolved: ResolvedPlayer): Phase {
  if (resolved.source === "player") return "in-program";
  return ["accepted", "placed"].includes(resolved.raw.status)
    ? "committed"
    : "trial";
}

/**
 * Resolves a URL id to a player record. The same id (UUID) may refer to:
 * 1. An in-program player's row (`players.id`)
 * 2. An in-program player whose `prospect_id` was preserved from the trial
 *    phase (the normal post-promotion case — their trial URL keeps working)
 * 3. A trial prospect (`trial_prospects.id`) — pre-acceptance phase
 *
 * Lookup order: players.id → players.prospect_id → trial_prospects.id.
 * Returns normalized data in `data` and the original row in `raw`.
 */
export async function resolvePlayer(id: string): Promise<ResolvedPlayer | null> {
  // 1. Direct player lookup
  {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) return { source: "player", data: normalizePlayer(data), raw: data };
  }

  // 2. Player by preserved prospect_id (normal post-promotion path)
  {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("prospect_id", id)
      .maybeSingle();
    if (data) return { source: "player", data: normalizePlayer(data), raw: data };
  }

  // 3. Trial prospect
  {
    const { data } = await supabase
      .from("trial_prospects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      const prospect = data as TrialProspect;
      return { source: "prospect", data: normalizeProspect(prospect), raw: prospect };
    }
  }

  return null;
}

function normalizePlayer(p: Record<string, unknown>): PlayerRecord {
  return {
    id: p.id as string,
    first_name: (p.first_name as string) || "",
    last_name: (p.last_name as string) || "",
    start_date: (p.program_start_date as string) || null,
    end_date: (p.program_end_date as string) || null,
    status: (p.status as string) || undefined,
    accommodation_type: (p.accommodation_type as string) || null,
    accommodation_notes: (p.housing_notes as string) || null,
    housing_notes: (p.housing_notes as string) || null,
    room_id: (p.room_id as string) || null,
    arrival_date: (p.arrival_date as string) || null,
    arrival_time: (p.arrival_time as string) || null,
    arrival_airport: (p.arrival_airport as string) || null,
    flight_number: (p.flight_number as string) || null,
    needs_pickup: (p.needs_pickup as boolean) ?? null,
    pickup_location: (p.pickup_location as string) || null,
    whatsapp_number: (p.whatsapp_number as string) || (p.phone as string) || null,
    travel_arrangements: null,
    travel_submitted_at: (p.travel_submitted_at as string) || null,
    onboarding_completed_at: (p.onboarding_completed_at as string) || null,
    scout_id: null,
    payment_link: (p.payment_link as string) || null,
    payment_amount: (p.payment_amount as string) || null,
    payment_status: (p.payment_status as string) || null,
    date_of_birth: (p.date_of_birth as string) || "",
    program: (p.program as PlayerRecord["program"]) ?? null,
    gender: (p.gender as PlayerRecord["gender"]) ?? null,
  };
}

function normalizeProspect(p: TrialProspect): PlayerRecord {
  return {
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    start_date: p.trial_start_date || null,
    end_date: p.trial_end_date || null,
    status: p.status,
    accommodation_type: p.accommodation_type || null,
    accommodation_notes: p.accommodation_notes || null,
    housing_notes: null,
    room_id: p.room_id || null,
    arrival_date: p.arrival_date || null,
    arrival_time: p.arrival_time || null,
    arrival_airport: p.arrival_airport || null,
    flight_number: p.flight_number || null,
    needs_pickup: p.needs_pickup ?? null,
    pickup_location: p.pickup_location || null,
    whatsapp_number: p.whatsapp_number || null,
    travel_arrangements: p.travel_arrangements || null,
    travel_submitted_at: p.travel_submitted_at || null,
    onboarding_completed_at: p.onboarding_completed_at || null,
    scout_id: p.scout_id || null,
    payment_link: p.payment_link || null,
    payment_amount: p.payment_amount || null,
    payment_status: p.payment_status || null,
    date_of_birth: p.date_of_birth,
    program: (p as { program?: PlayerRecord["program"] }).program ?? null,
    gender: (p as { gender?: PlayerRecord["gender"] }).gender ?? null,
  };
}
