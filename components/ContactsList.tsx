"use client";

import { useState } from "react";

type Contact = {
  name: string;
  role: string;
  organization?: string;
  photo_url?: string;
  nationality?: string;
};

const countryFlags: Record<string, string> = {
  DE: "🇩🇪", MX: "🇲🇽", US: "🇺🇸", GB: "🇬🇧", FR: "🇫🇷", ES: "🇪🇸",
  IT: "🇮🇹", BR: "🇧🇷", AR: "🇦🇷", NL: "🇳🇱", PT: "🇵🇹", JP: "🇯🇵",
  KR: "🇰🇷", AU: "🇦🇺", CA: "🇨🇦", AT: "🇦🇹", CH: "🇨🇭", BE: "🇧🇪",
  CO: "🇨🇴", CL: "🇨🇱", PE: "🇵🇪", IE: "🇮🇪", NG: "🇳🇬", GH: "🇬🇭",
};

export const ContactsList = ({ contacts }: { contacts: Contact[] }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (contacts.length === 0) return null;

  return (
    <section className="px-4 pb-8">
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Your Contacts
      </h2>
      <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:divide-zinc-700">
        {contacts.map((c) => {
          const isExpanded = expanded === c.name;

          return (
            <div key={c.name}>
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : c.name)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-zinc-50 dark:active:bg-zinc-700/50"
              >
                {c.photo_url ? (
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
                    <span className="text-sm font-semibold text-[#ED1C24]">
                      {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {c.name} {c.nationality && countryFlags[c.nationality] ? countryFlags[c.nationality] : ""}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {[c.role, c.organization].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>

              {/* Expanded full photo */}
              {isExpanded && c.photo_url && (
                <div className="px-4 pb-4">
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="w-full rounded-xl object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
