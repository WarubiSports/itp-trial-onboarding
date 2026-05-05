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
  const isClosed = source === "prospect" && ["rejected", "withdrawn"].includes(player.status || "");
  // Behavior-side Futures detection (intake copy, label "Intake" vs "Trial").
  const isFutures = (player as { program?: string }).program === "warubi_futures";
  // Brand-side Futures detection: female camp is FC Köln co-branded even
  // though it lives under warubi_futures admin-side. Drives data-program /
  // CSS brand color and the ITP/Futures logo lockup in WelcomeHeader.
  const isFuturesBranded = isFutures && (player as { gender?: string }).gender !== "female";

  // Label differs per phase: alumni / closed are finished, not active.
  // Futures uses "Intake" instead of "Trial" since the intake IS the program.
  const labelPrefix = isAlumni
    ? "Alumni"
    : isClosed
      ? "Closed"
      : source === "player"
        ? "Program"
        : isFutures
          ? "Intake"
          : "Trial";

  // Show onboarding tab: for prospects based on status, for active players.
  // Alumni + closed see no tabs — just their Info page.
  // Futures prospects skip the trial-status gate (auto-promoted at status `requested`).
  const showOnboarding =
    source === "player"
      ? true
      : isFutures
        ? true
        : ["scheduled", "accepted", "placed"].includes(player.status || "") ||
          !!player.onboarding_completed_at;

  return (
    <div className="min-h-screen flex flex-col items-center" data-program={isFuturesBranded ? "warubi_futures" : "itp_men"}>
      <main className="w-full max-w-[540px] min-h-screen lg:min-h-0 lg:my-8 lg:rounded-2xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl lg:shadow-black/40 lg:overflow-hidden">
        <WelcomeHeader player={player} scoutInfo={scoutInfo} labelPrefix={labelPrefix} />
        {isAlumni || isClosed ? null : source === "player" ? (
          <TabNav playerId={playerId} variant="program" program={(player as { program?: 'itp_men' | 'itp_women' | 'warubi_futures' }).program} />
        ) : showOnboarding ? (
          <TabNav playerId={playerId} variant="prospect" program={(player as { program?: 'itp_men' | 'itp_women' | 'warubi_futures' }).program} completed={!!player.onboarding_completed_at} />
        ) : null}
        {children}
      </main>
    </div>
  );
}
