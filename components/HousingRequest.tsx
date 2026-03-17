"use client";

import { useState } from "react";
import { Home, Check, Loader2 } from "lucide-react";

interface HousingAvailability {
  house_name: string;
  available: number;
  total_beds: number;
}

interface HousingRequestProps {
  prospectId: string;
  trialStart: string;
  trialEnd: string;
  availability: HousingAvailability[];
  totalAvailable: number;
  alreadyRequested: boolean;
}

export const HousingRequest = ({
  prospectId,
  trialStart,
  trialEnd,
  availability,
  totalAvailable,
  alreadyRequested,
}: HousingRequestProps) => {
  const [requested, setRequested] = useState(alreadyRequested);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/housing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      if (res.ok) {
        setRequested(true);
      }
    } catch {
      // Silently fail — staff will see it anyway
    } finally {
      setLoading(false);
    }
  };

  const hasSpace = totalAvailable > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Availability info */}
      <div
        className={`rounded-xl border p-3 ${
          hasSpace
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
            : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            hasSpace
              ? "text-emerald-900 dark:text-emerald-200"
              : "text-amber-900 dark:text-amber-200"
          }`}
        >
          {hasSpace
            ? `${totalAvailable} bed${totalAvailable !== 1 ? "s" : ""} available during your trial`
            : "Houses are full during your trial dates"}
        </p>
        {hasSpace && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {availability
              .filter((h) => h.available > 0)
              .map((h) => (
                <span
                  key={h.house_name}
                  className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                >
                  {h.house_name}: {h.available}/{h.total_beds}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Request button */}
      {requested ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
          <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Housing requested — staff will assign your room
          </p>
        </div>
      ) : (
        <button
          onClick={handleRequest}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#ED1C24] bg-white px-4 py-3 text-sm font-semibold text-[#ED1C24] transition-colors hover:bg-red-50 disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Home size={16} />
          )}
          {hasSpace ? "Request ITP Housing" : "Request Housing (Waitlist)"}
        </button>
      )}

      {!hasSpace && !requested && (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          You can still request — staff may find availability or suggest alternatives.
        </p>
      )}
    </div>
  );
};
