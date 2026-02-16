import Image from "next/image";
import type { TrialProspect } from "@/lib/types";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const WelcomeHeader = ({ prospect }: { prospect: TrialProspect }) => {
  const trialRange =
    prospect.trial_start_date && prospect.trial_end_date
      ? `${formatDate(prospect.trial_start_date)} – ${formatDate(prospect.trial_end_date)}`
      : null;

  return (
    <section className="flex flex-col items-center gap-3 pb-6 pt-8 text-center">
      <Image
        src="/warubi-fc-logo.png"
        alt="Warubi Sports x 1. FC Köln"
        width={240}
        height={60}
        priority
      />
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Welcome to the 1. FC Köln Bundesliga ITP
      </h1>
      <div className="flex flex-col gap-0.5">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
          {prospect.first_name} {prospect.last_name}
        </p>
        {trialRange && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Trial: {trialRange}
          </p>
        )}
      </div>
    </section>
  );
};
