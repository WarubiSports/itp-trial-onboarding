"use client";

import { useState, useCallback } from "react";
import { Loader2, CheckCircle2, Plane, Pencil } from "lucide-react";

type FirstActivity = {
  title: string;
  day: string;
  location: string;
  address?: string;
  mapsUrl?: string;
};

type Props = {
  prospectId: string;
  initial: {
    arrival_date?: string;
    arrival_time?: string;
    flight_number?: string;
    arrival_airport?: string;
    needs_pickup?: boolean;
    pickup_location?: string;
    whatsapp_number?: string;
  };
  firstActivity?: FirstActivity;
  /** If set, player already submitted — show a compact summary with an Edit button. */
  submittedAt?: string | null;
};

const ARRIVAL_POINTS = [
  { value: "CGN", label: "Cologne/Bonn (CGN)" },
  { value: "DUS", label: "Düsseldorf (DUS)" },
  { value: "KLN_HBF", label: "Köln Hbf (Train)" },
];

type PickupChoice = "airport" | "hotel" | "none";

export const TravelForm = ({ prospectId, initial, firstActivity, submittedAt }: Props) => {
  const initialPickup: PickupChoice = initial.needs_pickup === false
    ? "none"
    : initial.pickup_location
      ? "hotel"
      : "airport";

  const [form, setForm] = useState({
    arrival_date: initial.arrival_date || "",
    arrival_time: initial.arrival_time || "",
    flight_number: initial.flight_number || "",
    arrival_airport: initial.arrival_airport || "CGN",
    whatsapp_number: initial.whatsapp_number || "",
    pickup_location: initial.pickup_location || "",
  });
  const [pickupChoice, setPickupChoice] = useState<PickupChoice>(initialPickup);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  // Collapse to summary if already submitted; toggle to expand for edits.
  const [editing, setEditing] = useState(!submittedAt);

  const update = useCallback(
    (field: string, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setSaved(false);
    },
    []
  );

  const handlePickup = (choice: PickupChoice) => {
    setPickupChoice(choice);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          step: 0,
          data: {
            arrival_date: form.arrival_date || null,
            arrival_time: form.arrival_time || null,
            flight_number: form.flight_number || null,
            arrival_airport: form.arrival_airport || null,
            needs_pickup: pickupChoice !== "none",
            pickup_location: pickupChoice === "hotel" ? (form.pickup_location || null) : null,
            whatsapp_number: form.whatsapp_number || null,
            travel_submitted_at: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save");
      }
      setSaved(true);
      // Reload to show first activity info (computed server-side from arrival_date)
      if (!firstActivity && form.arrival_date) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const formatDateDisplay = (d: string) => {
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const pickupLabel =
    pickupChoice === "none"
      ? "Getting there myself"
      : pickupChoice === "hotel"
        ? `Pick-up from hotel${form.pickup_location ? ` (${form.pickup_location})` : ""}`
        : "Pick-up from airport / station";

  const arrivalPointLabel =
    ARRIVAL_POINTS.find((a) => a.value === form.arrival_airport)?.label ||
    form.arrival_airport ||
    "—";

  return (
    <section className="px-4 pb-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plane size={18} className="text-[var(--color-text-secondary)]" />
            <h3 className="text-base font-semibold text-[var(--color-text)]">
              Your Travel Details
            </h3>
          </div>
          {submittedAt && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] hover:underline"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        {!editing && submittedAt ? (
          <>
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-900/20 border border-green-700/30 px-3 py-2">
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <p className="text-sm text-green-300">
                {form.needs_pickup
                  ? "Travel details submitted. We'll pick you up."
                  : "Travel details submitted. See you at the academy."}
              </p>
            </div>

            <dl className="divide-y divide-[var(--color-border)] text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-[var(--color-text-secondary)]">Arrival</dt>
                <dd className="text-[var(--color-text)] text-right">
                  {formatDateDisplay(form.arrival_date)}
                  {form.arrival_time && ` · ${form.arrival_time}`}
                </dd>
              </div>
              {form.flight_number && (
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--color-text-secondary)]">Flight / Train</dt>
                  <dd className="text-[var(--color-text)]">{form.flight_number}</dd>
                </div>
              )}
              <div className="flex justify-between py-2">
                <dt className="text-[var(--color-text-secondary)]">Arrival point</dt>
                <dd className="text-[var(--color-text)] text-right">{arrivalPointLabel}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[var(--color-text-secondary)]">Pick-up</dt>
                <dd className="text-[var(--color-text)] text-right">{pickupLabel}</dd>
              </div>
              {form.whatsapp_number && (
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--color-text-secondary)]">WhatsApp</dt>
                  <dd className="text-[var(--color-text)]">{form.whatsapp_number}</dd>
                </div>
              )}
            </dl>

            {firstActivity && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-[var(--color-surface-elevated)] p-3">
                <span className="mt-0.5 text-sm">📍</span>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Your first activity is <strong>{firstActivity.title}</strong> on {firstActivity.day} at{' '}
                  <strong>{firstActivity.location}</strong>
                  {firstActivity.address && <span className="text-[var(--color-text-muted)]"> ({firstActivity.address})</span>}
                  {firstActivity.mapsUrl && (
                    <>{' '}<a href={firstActivity.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand)] underline">Maps</a></>
                  )}
                </p>
              </div>
            )}
          </>
        ) : (
        <>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Let us know when you&apos;re arriving so we can arrange transport.
        </p>

        {firstActivity && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-[var(--color-surface-elevated)] p-3">
            <span className="mt-0.5 text-sm">📍</span>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your first activity is <strong>{firstActivity.title}</strong> on {firstActivity.day} at{' '}
              <strong>{firstActivity.location}</strong>
              {firstActivity.address && <span className="text-[var(--color-text-muted)]"> ({firstActivity.address})</span>}
              {firstActivity.mapsUrl && (
                <>{' '}<a href={firstActivity.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand)] underline">Maps</a></>
              )}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="label">Arrival Date</label>
            <input
              type="date"
              value={form.arrival_date}
              onChange={(e) => update("arrival_date", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Arrival Time</label>
            <input
              type="time"
              value={form.arrival_time}
              onChange={(e) => update("arrival_time", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Flight / Train Number</label>
            <input
              type="text"
              placeholder="e.g. LH 1234"
              value={form.flight_number}
              onChange={(e) => update("flight_number", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Arrival Point</label>
            <div className="grid grid-cols-3 gap-2">
              {ARRIVAL_POINTS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => update("arrival_airport", a.value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    form.arrival_airport === a.value
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-glow)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pickup request — single clear question with 3 options */}
          <div>
            <label className="label">Need a pick-up?</label>
            <div className="grid grid-cols-1 gap-2">
              {([
                { value: "airport" as const, label: "Yes, from airport / station" },
                { value: "hotel" as const, label: "Yes, from my hotel" },
                { value: "none" as const, label: "No, I'll get there myself" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePickup(opt.value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                    pickupChoice === opt.value
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-glow)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hotel name — only when hotel pickup selected */}
          {pickupChoice === "hotel" && (
            <div>
              <label className="label">Hotel Name / Address</label>
              <input
                type="text"
                placeholder="e.g. Dorint Hotel Junkersdorf"
                value={form.pickup_location}
                onChange={(e) => update("pickup_location", e.target.value)}
                className="input"
              />
            </div>
          )}

          <div>
            <label className="label">WhatsApp Number</label>
            <input
              type="tel"
              placeholder="+1 555 123 4567"
              value={form.whatsapp_number}
              onChange={(e) => update("whatsapp_number", e.target.value)}
              className="input"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary mt-4 w-full"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 size={16} /> Saved</>
          ) : (
            "Save Travel Details"
          )}
        </button>
        </>
        )}
      </div>
    </section>
  );
};
