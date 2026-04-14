"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Camera, AlertCircle, Clock, Loader2 } from "lucide-react";
import type { Chore } from "@/app/[playerId]/chores/page";

const priorityStyles: Record<string, string> = {
  high: "border-red-700/40 bg-red-900/15",
  medium: "border-amber-700/30 bg-amber-900/10",
  low: "border-[var(--color-border)] bg-[var(--color-surface)]",
};

const formatDeadline = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffHours = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60));
  if (diffHours < 0) return { label: "Overdue", tone: "text-red-400" };
  if (diffHours < 24) return { label: `Due in ${diffHours}h`, tone: "text-amber-400" };
  const days = Math.round(diffHours / 24);
  return { label: `Due in ${days}d`, tone: "text-[var(--color-text-muted)]" };
};

const isComplete = (c: Chore) =>
  c.status === "completed" || c.status === "approved";

const isPendingApproval = (c: Chore) => c.status === "pending_approval";
const isRejected = (c: Chore) => c.status === "rejected";

export const ChoresList = ({
  playerId,
  chores,
}: {
  playerId: string;
  chores: Chore[];
}) => {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = chores.filter((c) => !isComplete(c));
  const done = chores.filter(isComplete);

  const handleComplete = async (choreId: string) => {
    setBusyId(choreId);
    setError(null);
    try {
      const res = await fetch("/api/chores/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chore_id: choreId, player_id: playerId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to mark complete");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  if (chores.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <CheckCircle2 size={24} className="mx-auto mb-2 text-green-400" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          No chores assigned right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)] mb-3">
            To Do · {pending.length}
          </h2>
          <div className="space-y-2">
            {pending.map((c) => {
              const deadline = formatDeadline(c.deadline);
              const busy = busyId === c.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-xl border p-4 ${priorityStyles[c.priority] ?? priorityStyles.low}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--color-text)] mb-0.5">
                        {c.title}
                      </p>
                      {c.description && (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {c.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                        <span className="text-[var(--color-brand)] font-semibold">
                          +{c.points} pts
                        </span>
                        {deadline && (
                          <span className={`flex items-center gap-1 ${deadline.tone}`}>
                            <Clock size={12} /> {deadline.label}
                          </span>
                        )}
                        {c.requires_photo && (
                          <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                            <Camera size={12} /> Photo required
                          </span>
                        )}
                      </div>
                      {isRejected(c) && c.rejection_reason && (
                        <div className="flex items-start gap-1.5 mt-2 text-xs text-red-400">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          <span>Rejected: {c.rejection_reason}</span>
                        </div>
                      )}
                      {isPendingApproval(c) && (
                        <p className="mt-2 text-xs text-amber-400">
                          Submitted — waiting for staff approval.
                        </p>
                      )}
                    </div>

                    {!isPendingApproval(c) && (
                      <button
                        type="button"
                        onClick={() => handleComplete(c.id)}
                        disabled={busy || c.requires_photo}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_12px_var(--color-brand-glow)] transition-shadow"
                      >
                        {busy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Circle size={12} />
                        )}
                        {busy ? "Saving" : "Done"}
                      </button>
                    )}
                  </div>
                  {c.requires_photo && !isPendingApproval(c) && (
                    <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                      Photo upload coming soon — complete this one in the Player App for now.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </section>
      )}

      {/* Done */}
      {done.length > 0 && (
        <section>
          <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)] mb-3">
            Done · {done.length}
          </h2>
          <div className="space-y-2">
            {done.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3 flex items-center gap-3 opacity-80"
              >
                <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {c.title}
                  </p>
                  {c.completed_at && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(c.completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-[var(--color-brand)]">
                  +{c.points}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
