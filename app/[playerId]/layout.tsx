import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { TrialProspect } from "@/lib/types";
import { WelcomeHeader } from "@/components/WelcomeHeader";
import { TabNav } from "@/components/TabNav";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
  children: React.ReactNode;
};

export default async function PlayerLayout({ params, children }: Props) {
  const { playerId } = await params;

  const { data: prospect, error } = await supabase
    .from("trial_prospects")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error || !prospect) {
    notFound();
  }

  const player = prospect as TrialProspect;

  // Only show onboarding tab for committed players
  const showOnboarding = ['accepted', 'placed'].includes(player.status) || !!player.onboarding_completed_at;

  return (
    <main className="mx-auto min-h-screen max-w-lg pb-safe">
      <WelcomeHeader prospect={player} />
      {showOnboarding ? (
        <>
          <TabNav playerId={playerId} completed={!!player.onboarding_completed_at} />
          <section className="px-4 pb-4">
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
              <span className="text-lg">📅</span>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">Preseason starts July 6, 2026.</span>{" "}
                Please complete your onboarding before then.
              </p>
            </div>
          </section>
        </>
      ) : null}
      {children}
    </main>
  );
}
