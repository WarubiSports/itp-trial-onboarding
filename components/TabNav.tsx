"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ClipboardCheck } from "lucide-react";

export const TabNav = ({
  playerId,
  completed,
}: {
  playerId: string;
  completed: boolean;
}) => {
  const pathname = usePathname();
  const isOnboarding = pathname.includes("/onboarding");

  const tabs = [
    {
      label: "Info",
      href: `/${playerId}`,
      icon: CalendarDays,
      active: !isOnboarding,
    },
    {
      label: completed ? "Onboarding \u2713" : "Onboarding",
      href: `/${playerId}/onboarding`,
      icon: ClipboardCheck,
      active: isOnboarding,
    },
  ];

  return (
    <nav className="mx-4 mb-6 flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-lg p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              tab.active
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)] shadow-sm shadow-[var(--color-brand-glow)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
