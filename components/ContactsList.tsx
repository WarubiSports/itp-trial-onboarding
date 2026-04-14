"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Contact = {
  name: string;
  role: string;
  organization?: string;
  photo_url?: string;
  nationality?: string;
};

const countryFlags: Record<string, string> = {
  DE: "\uD83C\uDDE9\uD83C\uDDEA", MX: "\uD83C\uDDF2\uD83C\uDDFD", US: "\uD83C\uDDFA\uD83C\uDDF8", GB: "\uD83C\uDDEC\uD83C\uDDE7", FR: "\uD83C\uDDEB\uD83C\uDDF7", ES: "\uD83C\uDDEA\uD83C\uDDF8",
  IT: "\uD83C\uDDEE\uD83C\uDDF9", BR: "\uD83C\uDDE7\uD83C\uDDF7", AR: "\uD83C\uDDE6\uD83C\uDDF7", NL: "\uD83C\uDDF3\uD83C\uDDF1", PT: "\uD83C\uDDF5\uD83C\uDDF9", JP: "\uD83C\uDDEF\uD83C\uDDF5",
  KR: "\uD83C\uDDF0\uD83C\uDDF7", AU: "\uD83C\uDDE6\uD83C\uDDFA", CA: "\uD83C\uDDE8\uD83C\uDDE6", AT: "\uD83C\uDDE6\uD83C\uDDF9", CH: "\uD83C\uDDE8\uD83C\uDDED", BE: "\uD83C\uDDE7\uD83C\uDDEA",
  CO: "\uD83C\uDDE8\uD83C\uDDF4", CL: "\uD83C\uDDE8\uD83C\uDDF1", PE: "\uD83C\uDDF5\uD83C\uDDEA", IE: "\uD83C\uDDEE\uD83C\uDDEA", NG: "\uD83C\uDDF3\uD83C\uDDEC", GH: "\uD83C\uDDEC\uD83C\uDDED",
};

export const ContactsList = ({ contacts }: { contacts: Contact[] }) => {
  const [lightbox, setLightbox] = useState<Contact | null>(null);

  if (contacts.length === 0) return null;

  return (
    <>
      <section className="px-4 pb-8">
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)]">
          Your Contacts
        </h2>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
          {contacts.map((c) => (
            <div key={c.name} className="flex items-center gap-3 p-4">
              {c.photo_url ? (
                <button
                  type="button"
                  onClick={() => setLightbox(c)}
                  className="shrink-0 group relative"
                  aria-label={`View photo of ${c.name}`}
                >
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="h-10 w-10 rounded-full object-cover object-top ring-2 ring-[var(--color-brand)]/20 transition-all group-hover:ring-[var(--color-brand)] group-hover:scale-110"
                  />
                </button>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-glow)]">
                  <span className="text-sm font-semibold text-[var(--color-brand)]">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--color-text)]">
                  {c.name} {c.nationality && countryFlags[c.nationality] ? countryFlags[c.nationality] : ""}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {[c.role, c.organization].filter(Boolean).join(" \u00B7 ")}
                </p>
                {c.photo_url && (
                  <button
                    type="button"
                    onClick={() => setLightbox(c)}
                    className="text-xs text-[var(--color-brand)]/70 hover:text-[var(--color-brand)] mt-0.5 transition-colors"
                  >
                    Tap to view photo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && lightbox.photo_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close photo"
          >
            <X size={20} />
          </button>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.photo_url}
              alt={lightbox.name}
              className="w-full rounded-2xl object-cover shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-semibold text-lg">{lightbox.name}</p>
              <p className="text-white/70 text-sm">
                {[lightbox.role, lightbox.organization].filter(Boolean).join(" \u00B7 ")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
