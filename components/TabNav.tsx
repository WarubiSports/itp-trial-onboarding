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
      label: completed ? "Onboarding ✓" : "Onboarding",
      href: `/${playerId}/onboarding`,
      icon: ClipboardCheck,
      active: isOnboarding,
    },
  ];

  return (
    <nav className="mx-4 mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              tab.active
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
