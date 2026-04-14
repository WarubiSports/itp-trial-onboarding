import { notFound, redirect } from "next/navigation";
import type { TrialProspect } from "@/lib/types";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { resolvePlayer } from "@/lib/resolvePlayer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

export default async function OnboardingPage({ params }: Props) {
  const { playerId } = await params;
  const resolved = await resolvePlayer(playerId);

  if (!resolved) notFound();

  // In-program players have already onboarded — send them to the main view.
  if (resolved.source === "player") {
    redirect(`/${playerId}`);
  }

  const player = resolved.raw as TrialProspect;

  // Rejected / withdrawn — no onboarding flow, send to the ClosedView.
  if (player.status === "rejected" || player.status === "withdrawn") {
    redirect(`/${playerId}`);
  }

  // Allow onboarding for scheduled, accepted, and placed players
  if (!['scheduled', 'accepted', 'placed'].includes(player.status) && !player.onboarding_completed_at) {
    notFound();
  }

  // Auto-detect U18 status
  const dob = new Date(player.date_of_birth);
  const trialStart = player.trial_start_date
    ? new Date(player.trial_start_date)
    : new Date();
  const ageAtTrial = Math.floor(
    (trialStart.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  const isUnder18 = ageAtTrial < 18;

  // Trial phase = pre-acceptance. Program phase = accepted/placed.
  const phase: "trial" | "program" =
    player.status === "scheduled" ? "trial" : "program";

  return (
    <OnboardingForm prospect={player} isUnder18={isUnder18} phase={phase} />
  );
}
