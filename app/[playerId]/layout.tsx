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

  const isAlumni = source === "player" && player.status === "alumni";

  // Label differs per phase: alumni are finished, not active.
  const labelPrefix = isAlumni ? "Alumni" : source === "player" ? "Program" : "Trial";

  // Show onboarding tab: for prospects based on status, for active players.
  // Alumni see no tabs — just their Info (alumni view) page.
  const showOnboarding =
    source === "player"
      ? true
      : ["scheduled", "accepted", "placed"].includes(player.status || "") ||
        !!player.onboarding_completed_at;

  return (
    <div className="min-h-screen flex flex-col items-center">
      <main className="w-full max-w-[540px] min-h-screen lg:min-h-0 lg:my-8 lg:rounded-2xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl lg:shadow-black/40 lg:overflow-hidden">
        <WelcomeHeader player={player} scoutInfo={scoutInfo} labelPrefix={labelPrefix} />
        {isAlumni ? null : source === "player" ? (
          <TabNav playerId={playerId} variant="program" />
        ) : showOnboarding ? (
          <TabNav playerId={playerId} variant="prospect" completed={!!player.onboarding_completed_at} />
        ) : null}
        {children}
      </main>
    </div>
  );
}
