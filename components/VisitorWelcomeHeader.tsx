import Image from "next/image";
import type { Visitor } from "@/lib/types";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const roleLabels: Record<string, string> = {
  agent: "Agent",
  coach: "Coach",
  partner: "Partner",
  parent: "Parent",
  scout: "Scout",
};

interface VisitorWelcomeHeaderProps {
  visitor: Visitor;
}

export const VisitorWelcomeHeader = ({ visitor }: VisitorWelcomeHeaderProps) => {
  const range =
    visitor.visit_start_date === visitor.visit_end_date
      ? formatDate(visitor.visit_start_date)
      : `${formatDate(visitor.visit_start_date)} – ${formatDate(visitor.visit_end_date)}`;

  const initials = getInitials(visitor.first_name, visitor.last_name);
  const roleLabel = roleLabels[visitor.role] || visitor.role;

  return (
    <div className="relative overflow-hidden bg-[var(--color-brand)]">
      <div className="relative px-5 pt-8 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Image
            src="/warubi-sports-logo.png"
            alt="Warubi Sports"
            width={90}
            height={24}
            priority
            className="opacity-90 object-contain"
          />
          <div className="text-center">
            <p className="text-[9px] font-bold tracking-[3px] text-white/70 uppercase">
              International Talent Pathway
            </p>
          </div>
          <Image
            src="/fc-koln-crest.png"
            alt="1. FC Köln"
            width={36}
            height={44}
            priority
            className="opacity-90 object-contain"
          />
        </div>

        <div className="h-[2px] bg-white/20 mb-5 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-[var(--color-brand)] opacity-40 blur-md" />
            <div className="relative w-14 h-14 rounded-full bg-[var(--color-surface)] ring-2 ring-white/20 flex items-center justify-center text-white font-bold text-lg font-[family-name:var(--font-outfit)]">
              {initials}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-tight">
              Welcome, {visitor.first_name}
            </h1>
            <span className="inline-block mt-1 text-xs font-medium text-white/80 bg-white/10 backdrop-blur-sm rounded-full px-3 py-0.5">
              Visit: {range}
            </span>
            <p className="text-xs text-white/60 mt-1">
              {visitor.organization ? `${visitor.organization} · ` : ""}
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
