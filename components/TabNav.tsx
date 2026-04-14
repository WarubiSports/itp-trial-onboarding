"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ClipboardCheck, Activity, Home, ShoppingCart } from "lucide-react";

type Variant = "prospect" | "program";

type TabNavProps = {
  playerId: string;
  variant?: Variant;
  /** Only used in `prospect` variant — shows a checkmark when onboarding is done. */
  completed?: boolean;
};

/**
 * Bottom navigation. Prospect variant has Info / Onboarding tabs.
 * Program variant has Info / Wellness for now — add Chores, Grocery, etc. as ported.
 */
export const TabNav = ({ playerId, variant = "prospect", completed = false }: TabNavProps) => {
  const pathname = usePathname();

  const tabs =
    variant === "program"
      ? [
          {
            label: "Info",
            href: `/${playerId}`,
            icon: CalendarDays,
            active:
              !pathname.includes("/wellness") &&
              !pathname.includes("/chores") &&
              !pathname.includes("/grocery"),
          },
          {
            label: "Wellness",
            href: `/${playerId}/wellness`,
            icon: Activity,
            active: pathname.includes("/wellness"),
          },
          {
            label: "Chores",
            href: `/${playerId}/chores`,
            icon: Home,
            active: pathname.includes("/chores"),
          },
          {
            label: "Grocery",
            href: `/${playerId}/grocery`,
            icon: ShoppingCart,
            active: pathname.includes("/grocery"),
          },
        ]
      : [
          {
            label: "Info",
            href: `/${playerId}`,
            icon: CalendarDays,
            active: !pathname.includes("/onboarding"),
          },
          {
            label: completed ? "Onboarding \u2713" : "Onboarding",
            href: `/${playerId}/onboarding`,
            icon: ClipboardCheck,
            active: pathname.includes("/onboarding"),
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
