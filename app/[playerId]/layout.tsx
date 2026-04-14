import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resolvePlayer } from "@/lib/resolvePlayer";
import { WelcomeHeader } from "@/components/WelcomeHeader";
import { TabNav } from "@/components/TabNav";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
  children: React.ReactNode;
};

export default async function PlayerLayout({ params, children }: Props) {
  const { playerId } = await params;
  const resolved = await resolvePlayer(playerId);

  if (!resolved) {
    notFound();
  }

  const { source, data: player } = resolved;

  // Fetch scout info only for prospects (players don't carry scout_id)
  let scoutInfo: { name: string; affiliation: string | null } | null = null;
  if (source === "prospect" && player.scout_id) {
    const { data: scout } = await supabase
      .from("scouts")
      .select("name, affiliation")
      .eq("id", player.scout_id)
      .single();
    if (scout) scoutInfo = scout;
  }

  // Label differs per phase
  const labelPrefix = source === "player" ? "Program" : "Trial";

  // Show onboarding tab: for prospects based on status, for players always (completed)
  const showOnboarding =
    source === "player"
      ? true
      : ["scheduled", "accepted", "placed"].includes(player.status || "") ||
        !!player.onboarding_completed_at;

  return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="w-full max-w-[540px] min-h-screen lg:min-h-0 lg:my-8 lg:rounded-2xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl lg:shadow-black/40 lg:overflow-hidden">
        <WelcomeHeader player={player} scoutInfo={scoutInfo} labelPrefix={labelPrefix} />
        {showOnboarding && source === "prospect" ? (
          <>
            <TabNav playerId={playerId} completed={!!player.onboarding_completed_at} />
            {/* Preseason banner only for accepted/placed (program-bound) prospects, not trial (scheduled). */}
            {["accepted", "placed"].includes(player.status || "") && (
              <section className="px-4 pb-4">
                <div className="flex items-center gap-3 rounded-xl border border-blue-700/30 bg-blue-900/20 p-4">
                  <span className="text-lg">📅</span>
                  <p className="text-sm text-blue-300">
                    <span className="font-semibold">Preseason starts July 6, 2026.</span>{" "}
                    Please complete your onboarding before then.
                  </p>
                </div>
              </section>
            )}
          </>
        ) : null}
        {children}
      </main>
    </div>
  );
}
