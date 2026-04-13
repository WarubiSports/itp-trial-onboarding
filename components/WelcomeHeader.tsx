import Image from "next/image";
import type { TrialProspect } from "@/lib/types";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

interface WelcomeHeaderProps {
  prospect: TrialProspect;
  scoutInfo?: { name: string; affiliation: string | null } | null;
}

export const WelcomeHeader = ({ prospect, scoutInfo }: WelcomeHeaderProps) => {
  const trialRange =
    prospect.trial_start_date && prospect.trial_end_date
      ? `${formatDate(prospect.trial_start_date)} – ${formatDate(prospect.trial_end_date)}`
      : prospect.trial_start_date
      ? `Starting ${formatDate(prospect.trial_start_date)}`
      : null;

  const initials = getInitials(prospect.first_name, prospect.last_name);

  return (
    <div className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)] via-[#8B1118] to-[var(--color-bg)]" />

      {/* Diagonal stripe pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 12px
          )`,
        }}
      />

      {/* Content */}
      <div className="relative px-5 pt-10 pb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-[var(--color-brand)] opacity-40 blur-md" />
            <div className="relative w-16 h-16 rounded-full bg-[var(--color-surface)] ring-2 ring-[var(--color-brand)] flex items-center justify-center text-white font-bold text-xl font-[family-name:var(--font-outfit)]">
              {initials}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-tight">
              Welcome, {prospect.first_name}
            </h1>
            <span className="inline-block mt-1.5 text-xs font-medium text-white/80 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
              {trialRange ? `Trial: ${trialRange}` : 'Dates to be confirmed'}
            </span>
            {scoutInfo && (
              <p className="text-xs text-white/60 mt-1">
                Referred by {scoutInfo.name}
                {scoutInfo.affiliation && ` (${scoutInfo.affiliation})`}
              </p>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mt-5">
          <Image
            src="/warubi-fc-logo.png"
            alt="Warubi Sports x 1. FC Köln"
            width={200}
            height={50}
            priority
            className="opacity-90"
          />
        </div>
      </div>

      {/* Bottom fade into page bg */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
    </div>
  );
};
