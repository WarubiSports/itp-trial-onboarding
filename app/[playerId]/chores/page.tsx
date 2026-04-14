import { supabase } from "@/lib/supabase";
import { resolvePlayer } from "@/lib/resolvePlayer";
import { ChoresList } from "@/components/ChoresList";
import { HouseLeaderboard } from "@/components/HouseLeaderboard";
import { CalendarClock, Home } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

export type Chore = {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  points: number;
  status: string;
  deadline: string | null;
  completed_at: string | null;
  requires_photo: boolean;
  rejection_reason: string | null;
};

type HouseRow = {
  id: string;
  name: string;
  total_points: number | null;
};

export default async function ChoresPage({ params }: Props) {
  const { playerId: urlId } = await params;
  const resolved = await resolvePlayer(urlId);

  if (!resolved) notFound();

  if (resolved.source !== "player") {
    return (
      <div className="py-12 px-4 text-center">
        <CalendarClock size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Chores are available once you&apos;re in the program.
        </p>
        <Link
          href={`/${urlId}`}
          className="text-sm font-semibold text-[var(--color-brand)] hover:underline"
        >
          Back to your info →
        </Link>
      </div>
    );
  }

  const playerId = resolved.data.id;
  const houseId = (resolved.raw as { house_id?: string | null }).house_id ?? null;

  // Player's chores
  const { data: choreData } = await supabase
    .from("chores")
    .select(
      "id, title, description, priority, points, status, deadline, completed_at, requires_photo, rejection_reason"
    )
    .eq("assigned_to", playerId)
    .order("deadline", { ascending: true, nullsFirst: false });

  const chores = (choreData || []) as Chore[];

  // House leaderboard — all houses sorted by total_points
  const { data: housesData } = await supabase
    .from("houses")
    .select("id, name, total_points")
    .order("total_points", { ascending: false });

  const houses = (housesData || []) as HouseRow[];

  // Player's own house name (for context)
  const myHouseName = houseId ? houses.find((h) => h.id === houseId)?.name : null;

  return (
    <div className="space-y-6 py-4 px-4">
      {myHouseName && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2">
          <Home size={16} className="text-[var(--color-brand)]" />
          <p className="text-sm text-[var(--color-text)]">
            <span className="text-[var(--color-text-secondary)]">Your house · </span>
            <span className="font-semibold">{myHouseName}</span>
          </p>
        </div>
      )}

      <ChoresList playerId={playerId} chores={chores} />

      {houses.length > 0 && (
        <HouseLeaderboard houses={houses} myHouseId={houseId} />
      )}
    </div>
  );
}
