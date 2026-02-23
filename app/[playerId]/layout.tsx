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

  return (
    <main className="mx-auto min-h-screen max-w-lg pb-safe">
      <WelcomeHeader prospect={player} />
      <TabNav playerId={playerId} completed={!!player.onboarding_completed_at} />
      {children}
    </main>
  );
}
