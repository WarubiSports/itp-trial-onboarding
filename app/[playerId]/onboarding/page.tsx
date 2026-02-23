import { supabase } from "@/lib/supabase";
import type { TrialProspect } from "@/lib/types";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

export default async function OnboardingPage({ params }: Props) {
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

  // Auto-detect U18 status
  const dob = new Date(player.date_of_birth);
  const trialStart = player.trial_start_date
    ? new Date(player.trial_start_date)
    : new Date();
  const ageAtTrial = Math.floor(
    (trialStart.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const isUnder18 = ageAtTrial < 18;

  return (
    <OnboardingForm prospect={player} isUnder18={isUnder18} />
  );
}
