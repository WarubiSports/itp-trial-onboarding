"use client";

import { useState, useCallback } from "react";
import { Loader2, CheckCircle2, Plane } from "lucide-react";

type Props = {
  visitorId: string;
  initial: {
    arrival_date?: string;
    arrival_time?: string;
    flight_number?: string;
    arrival_airport?: string;
    needs_pickup?: boolean;
    pickup_location?: string;
    whatsapp_number?: string;
  };
};

const ARRIVAL_POINTS = [
  { value: "CGN", label: "Cologne/Bonn (CGN)" },
  { value: "DUS", label: "Düsseldorf (DUS)" },
  { value: "KLN_HBF", label: "Köln Hbf (Train)" },
];

type PickupChoice = "airport" | "hotel" | "none";

export const VisitorTravelForm = ({ visitorId, initial }: Props) => {
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

  const update = useCallback(
    (field: string, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setSaved(false);
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/visitor-travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="px-4 pb-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-4 flex items-center gap-2">
          <Plane size={18} className="text-zinc-500" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Your Travel Details
          </h3>
        </div>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Let us know when you&apos;re arriving so we can arrange transport.
        </p>

        <div className="space-y-3">
          <div>
            <label className="label">Arrival Date</label>
            <input type="date" value={form.arrival_date} onChange={(e) => update("arrival_date", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Arrival Time</label>
            <input type="time" value={form.arrival_time} onChange={(e) => update("arrival_time", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Flight / Train Number</label>
            <input type="text" placeholder="e.g. LH 1234" value={form.flight_number} onChange={(e) => update("flight_number", e.target.value)} className="input" />
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
                      ? "border-[#ED1C24] bg-red-50 text-[#ED1C24] dark:bg-red-950/30 dark:text-red-400"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

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
                  onClick={() => { setPickupChoice(opt.value); setSaved(false); }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                    pickupChoice === opt.value
                      ? "border-[#ED1C24] bg-red-50 text-[#ED1C24] dark:bg-red-950/30 dark:text-red-400"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {pickupChoice === "hotel" && (
            <div>
              <label className="label">Hotel Name / Address</label>
              <input type="text" placeholder="e.g. Dorint Hotel Junkersdorf" value={form.pickup_location} onChange={(e) => update("pickup_location", e.target.value)} className="input" />
            </div>
          )}

          <div>
            <label className="label">WhatsApp Number</label>
            <input type="tel" placeholder="+1 555 123 4567" value={form.whatsapp_number} onChange={(e) => update("whatsapp_number", e.target.value)} className="input" />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary mt-4 w-full">
          {saving ? (<><Loader2 size={16} className="animate-spin" /> Saving...</>) : saved ? (<><CheckCircle2 size={16} /> Saved</>) : "Save Travel Details"}
        </button>
      </div>
    </section>
  );
};
