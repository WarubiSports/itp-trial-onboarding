import type { TrialProspect } from "@/lib/types";

const FCKolnCrest = () => (
  <svg viewBox="0 0 100 120" className="h-16 w-14" aria-label="1. FC Köln crest">
    <path
      d="M50 5 L90 25 L90 85 Q90 110 50 115 Q10 110 10 85 L10 25 Z"
      fill="#ED1C24"
      stroke="#fff"
      strokeWidth="2"
    />
    <text
      x="50"
      y="50"
      textAnchor="middle"
      fill="#fff"
      fontSize="14"
      fontWeight="700"
      fontFamily="sans-serif"
    >
      1. FC
    </text>
    <text
      x="50"
      y="72"
      textAnchor="middle"
      fill="#fff"
      fontSize="16"
      fontWeight="700"
      fontFamily="sans-serif"
    >
      KÖLN
    </text>
  </svg>
);

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
      <FCKolnCrest />
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Welcome to the ITP Köln
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
