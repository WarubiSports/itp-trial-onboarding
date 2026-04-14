import { supabase } from "@/lib/supabase";
import { resolvePlayer } from "@/lib/resolvePlayer";
import { WellnessForm } from "@/components/WellnessForm";
import { WellnessHistory } from "@/components/WellnessHistory";
import { CalendarClock } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

type WellnessLog = {
  id: string;
  date: string;
  sleep_hours: number;
  sleep_quality: number;
  energy_level: number;
  muscle_soreness: number;
  stress_level: number;
  mood: string;
  notes: string | null;
};

export default async function WellnessPage({ params }: Props) {
  const { playerId: urlId } = await params;
  const resolved = await resolvePlayer(urlId);

  if (!resolved) notFound();

  // Alumni are no longer active — send them to the alumni info page.
  if (resolved.source === "player" && (resolved.raw as { status?: string }).status === "alumni") {
    const { redirect } = await import("next/navigation");
    redirect(`/${urlId}`);
  }

  // Wellness is only available to in-program players.
  if (resolved.source !== "player") {
    return (
      <div className="py-12 px-4 text-center">
        <CalendarClock size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Wellness tracking is available once you&apos;re in the program.
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

  // Use the player's canonical id (not the URL param, which may be the prospect_id).
  const playerId = resolved.data.id;
  const programStart = resolved.data.start_date;

  // Gate wellness by program start date
  if (programStart) {
    const today = new Date().toISOString().split("T")[0];
    if (today < programStart) {
      const formatted = new Date(programStart + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
      );
      return (
        <div className="py-12 px-4 text-center">
          <CalendarClock size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-secondary)] text-sm">
            Available when your program begins on{" "}
            <span className="font-semibold text-[var(--color-text)]">{formatted}</span>
          </p>
        </div>
      );
    }
  }

  const { data: logs } = await supabase
    .from("wellness_logs")
    .select("*")
    .eq("player_id", playerId)
    .order("date", { ascending: false })
    .limit(14);

  const today = new Date().toISOString().split("T")[0];
  const logArr = (logs || []) as WellnessLog[];
  const todayLog = logArr.find((l) => l.date === today);

  // Prefill from yesterday if no today log exists (ported from Vite Wellness.jsx).
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const yesterdayLog = logArr.find((l) => l.date === yesterdayStr);
  const prefill = todayLog ?? yesterdayLog;

  // Streak count — consecutive days with a log, ending today or yesterday.
  const logDates = new Set(logArr.map((l) => l.date));
  let streak = 0;
  const cursor = new Date();
  // If today not logged yet, start counting from yesterday
  if (!logDates.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (logDates.has(cursor.toISOString().split("T")[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return (
    <div className="space-y-6 py-4 px-4">
      {streak > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2">
          <span className="text-lg">🔥</span>
          <p className="text-sm text-[var(--color-text)]">
            <span className="font-semibold">{streak}-day streak</span>
            <span className="text-[var(--color-text-secondary)]"> · keep it going</span>
          </p>
        </div>
      )}
      <WellnessForm
        playerId={playerId}
        existingLog={prefill}
        isPrefillFromYesterday={!todayLog && !!yesterdayLog}
      />
      <WellnessHistory logs={logArr.slice(0, 7)} />
    </div>
  );
}
