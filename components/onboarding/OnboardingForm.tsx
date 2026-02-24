"use client";

import { useState, useEffect, useCallback } from "react";
import type { TrialProspect } from "@/lib/types";
import { FileUpload } from "./FileUpload";
import {
  Plane,
  Shirt,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";

type Props = {
  prospect: TrialProspect;
  isUnder18: boolean;
};

const ARRIVAL_POINTS = [
  { value: "CGN", label: "Cologne/Bonn (CGN)" },
  { value: "DUS", label: "Düsseldorf (DUS)" },
  { value: "KLN_HBF", label: "Köln Hbf (Train)" },
];

const SIZES = ["S", "M", "L", "XL"];

type FormState = {
  arrival_date: string;
  arrival_time: string;
  flight_number: string;
  arrival_airport: string;
  needs_pickup: boolean;
  whatsapp_number: string;
  equipment_size: string;
  schengen_last_180_days: boolean | null;
  schengen_entry_date: string;
  schengen_days_spent: string;
};

const STORAGE_KEY = (id: string) => `onboarding_${id}`;

export const OnboardingForm = ({ prospect, isUnder18 }: Props) => {
  const totalSteps = isUnder18 ? 5 : 4;
  const [step, setStep] = useState(prospect.onboarding_step || 1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!prospect.onboarding_completed_at);
  const [error, setError] = useState("");

  // File upload state
  const [passportPath, setPassportPath] = useState(prospect.passport_file_path || "");
  const [parent1PassportPath, setParent1PassportPath] = useState(prospect.parent1_passport_file_path || "");
  const [parent2PassportPath, setParent2PassportPath] = useState(prospect.parent2_passport_file_path || "");
  const [vollmachtPath, setVollmachtPath] = useState(prospect.vollmacht_file_path || "");
  const [wellpassPath, setWellpassPath] = useState(prospect.wellpass_consent_file_path || "");

  const [form, setForm] = useState<FormState>(() => {
    // Try localStorage first, then DB values
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY(prospect.id));
      if (saved) return JSON.parse(saved);
    }
    return {
      arrival_date: prospect.arrival_date || "",
      arrival_time: prospect.arrival_time || "",
      flight_number: prospect.flight_number || "",
      arrival_airport: prospect.arrival_airport || "CGN",
      needs_pickup: prospect.needs_pickup ?? true,
      whatsapp_number: prospect.whatsapp_number || "",
      equipment_size: prospect.equipment_size || "",
      schengen_last_180_days: prospect.schengen_last_180_days ?? null,
      schengen_entry_date: prospect.schengen_entry_date || "",
      schengen_days_spent: prospect.schengen_days_spent?.toString() || "",
    };
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY(prospect.id), JSON.stringify(form));
  }, [form, prospect.id]);

  const update = useCallback(
    (field: keyof FormState, value: string | boolean | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const saveStep = async (nextStep: number) => {
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          step: nextStep,
          data: {
            ...form,
            arrival_date: form.arrival_date || null,
            arrival_time: form.arrival_time || null,
            flight_number: form.flight_number || null,
            arrival_airport: form.arrival_airport || null,
            whatsapp_number: form.whatsapp_number || null,
            schengen_entry_date: form.schengen_entry_date || null,
            schengen_days_spent: form.schengen_days_spent ? parseInt(form.schengen_days_spent, 10) : null,
            is_under_18: isUnder18,
            passport_file_path: passportPath || undefined,
            parent1_passport_file_path: parent1PassportPath || undefined,
            parent2_passport_file_path: parent2PassportPath || undefined,
            vollmacht_file_path: vollmachtPath || undefined,
            wellpass_consent_file_path: wellpassPath || undefined,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save progress");
      throw e;
    }
  };

  const validateStep = (currentStep: number): string | null => {
    switch (currentStep) {
      case 1:
        return null; // Travel is optional — can be skipped
      case 2:
        if (!form.equipment_size) return "Please select your equipment size";
        if (form.schengen_last_180_days === null) return "Please answer the Schengen question";
        return null;
      case 3:
        if (!passportPath) return "Please upload your passport";
        if (isUnder18 && !parent1PassportPath) return "Please upload Parent 1 passport";
        return null;
      case 4:
        if (isUnder18) {
          if (!vollmachtPath) return "Please upload the signed Vollmacht";
          if (!wellpassPath) return "Please upload the signed Wellpass Consent";
        }
        return null;
      default:
        return null;
    }
  };

  const nextStep = async () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const next = step + 1;
      await saveStep(next);
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // error already set
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          step: totalSteps,
          submit: true,
          data: {
            ...form,
            arrival_date: form.arrival_date || null,
            arrival_time: form.arrival_time || null,
            flight_number: form.flight_number || null,
            arrival_airport: form.arrival_airport || null,
            whatsapp_number: form.whatsapp_number || null,
            schengen_entry_date: form.schengen_entry_date || null,
            schengen_days_spent: form.schengen_days_spent ? parseInt(form.schengen_days_spent, 10) : null,
            is_under_18: isUnder18,
            passport_file_path: passportPath || undefined,
            parent1_passport_file_path: parent1PassportPath || undefined,
            parent2_passport_file_path: parent2PassportPath || undefined,
            vollmacht_file_path: vollmachtPath || undefined,
            wellpass_consent_file_path: wellpassPath || undefined,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit");
      }
      setSubmitted(true);
      localStorage.removeItem(STORAGE_KEY(prospect.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Onboarding Complete
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Thank you, {prospect.first_name}! The ITP staff has been notified and
          will be in touch before your arrival.
        </p>
      </div>
    );
  }

  // Step indicators
  const stepLabels = isUnder18
    ? ["Travel", "Equipment", "Documents", "U18 Forms", "Confirm"]
    : ["Travel", "Equipment", "Documents", "Confirm"];

  const stepIcons = isUnder18
    ? [Plane, Shirt, FileText, ShieldCheck, CheckCircle2]
    : [Plane, Shirt, FileText, CheckCircle2];

  // Determine which step content to render
  // For non-U18, skip step 4 (U18 Forms)
  const getStepContent = () => {
    if (!isUnder18 && step === 4) return renderConfirm();
    switch (step) {
      case 1: return renderTravel();
      case 2: return renderEquipment();
      case 3: return renderDocuments();
      case 4: return renderU18Forms();
      case 5: return renderConfirm();
      default: return null;
    }
  };

  const renderTravel = () => (
    <div className="space-y-4">
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
        <label className="label">Flight Number</label>
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
        <label className="label">Do you need a pick-up?</label>
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => update("needs_pickup", val)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                form.needs_pickup === val
                  ? "border-[#ED1C24] bg-red-50 text-[#ED1C24] dark:bg-red-950/30 dark:text-red-400"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-600 dark:text-zinc-300"
              }`}
            >
              {val ? "Yes, please" : "No, I'm set"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">WhatsApp Number</label>
        <input
          type="tel"
          placeholder="+1 555 123 4567"
          value={form.whatsapp_number}
          onChange={(e) => update("whatsapp_number", e.target.value)}
          className="input"
        />
        <p className="mt-1 text-xs text-zinc-400">
          We use WhatsApp for quick communication during your trial.
        </p>
      </div>
    </div>
  );

  const renderEquipment = () => (
    <div className="space-y-4">
      <div>
        <label className="label">Equipment Size</label>
        <p className="mb-2 text-xs text-zinc-400">
          Note: US Medium = EU Large. Select your <strong>US size</strong>.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update("equipment_size", s)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                form.equipment_size === s
                  ? "border-[#ED1C24] bg-red-50 text-[#ED1C24] dark:bg-red-950/30 dark:text-red-400"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-600 dark:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">
          Have you been in the Schengen area in the last 180 days?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: true, label: "Yes" },
            { val: false, label: "No" },
          ].map(({ val, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => update("schengen_last_180_days", val)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                form.schengen_last_180_days === val
                  ? "border-[#ED1C24] bg-red-50 text-[#ED1C24] dark:bg-red-950/30 dark:text-red-400"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-600 dark:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          This helps us understand your visa situation for the Schengen 90/180 rule.
        </p>
      </div>
      {form.schengen_last_180_days === true && (
        <>
          <div>
            <label className="label">When did you last enter the Schengen area?</label>
            <input
              type="date"
              value={form.schengen_entry_date}
              onChange={(e) => update("schengen_entry_date", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">How many days have you spent in Schengen (last 180 days)?</label>
            <input
              type="number"
              placeholder="e.g. 14"
              min="1"
              max="180"
              value={form.schengen_days_spent}
              onChange={(e) => update("schengen_days_spent", e.target.value)}
              className="input"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-5">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Upload clear photos or scans. Max 10 MB per file.
      </p>
      <FileUpload
        label="Player Passport (bio page)"
        prospectId={prospect.id}
        documentType="passport"
        currentPath={passportPath}
        onUploaded={setPassportPath}
      />
      {isUnder18 && (
        <>
          <FileUpload
            label="Parent 1 Passport (bio page)"
            prospectId={prospect.id}
            documentType="parent1_passport"
            currentPath={parent1PassportPath}
            onUploaded={setParent1PassportPath}
          />
          <FileUpload
            label="Parent 2 Passport (bio page)"
            prospectId={prospect.id}
            documentType="parent2_passport"
            currentPath={parent2PassportPath}
            onUploaded={setParent2PassportPath}
          />
        </>
      )}
    </div>
  );

  const renderU18Forms = () => (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Since {prospect.first_name} is under 18, we need signed consent forms
          from a parent or legal guardian. Please download, print, sign, and
          re-upload each form.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            1. Vollmacht (Power of Attorney)
          </p>
          <a
            href="/vollmacht.pdf"
            download="Vollmacht.pdf"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <FileText size={16} /> Download Vollmacht PDF
          </a>
        </div>
        <FileUpload
          label="Upload signed Vollmacht"
          prospectId={prospect.id}
          documentType="vollmacht"
          currentPath={vollmachtPath}
          onUploaded={setVollmachtPath}
        />
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            2. Wellpass Gym Consent
          </p>
          <a
            href={`/api/onboarding/templates/wellpass?prospectId=${prospect.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <FileText size={16} /> Download Wellpass Consent PDF
          </a>
        </div>
        <FileUpload
          label="Upload signed Wellpass Consent"
          prospectId={prospect.id}
          documentType="wellpass_consent"
          currentPath={wellpassPath}
          onUploaded={setWellpassPath}
        />
      </div>
    </div>
  );

  const renderConfirm = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Please review your information
      </h3>

      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-800">
        <SummaryRow label="Arrival" value={form.arrival_date ? `${form.arrival_date} at ${form.arrival_time || "TBD"}` : "Not set"} />
        <SummaryRow label="Flight" value={form.flight_number || "Not provided"} />
        <SummaryRow label="Arrival Point" value={ARRIVAL_POINTS.find((a) => a.value === form.arrival_airport)?.label || form.arrival_airport || "Not set"} />
        <SummaryRow label="Pick-up" value={form.needs_pickup ? "Yes" : "No"} />
        <SummaryRow label="WhatsApp" value={form.whatsapp_number || "Not provided"} />
        <SummaryRow label="Equipment Size" value={form.equipment_size || "Not set"} />
        <SummaryRow label="Schengen 180d" value={form.schengen_last_180_days === null ? "Not answered" : form.schengen_last_180_days ? "Yes" : "No"} />
        {form.schengen_last_180_days && (
          <>
            <SummaryRow label="Last Entry" value={form.schengen_entry_date || "Not provided"} />
            <SummaryRow label="Days Spent" value={form.schengen_days_spent || "Not provided"} />
          </>
        )}
        <SummaryRow label="Passport" value={passportPath ? "Uploaded" : "Missing"} highlight={!passportPath} />
        {isUnder18 && (
          <>
            <SummaryRow label="Parent 1 Passport" value={parent1PassportPath ? "Uploaded" : "Missing"} highlight={!parent1PassportPath} />
            <SummaryRow label="Parent 2 Passport" value={parent2PassportPath ? "Uploaded" : "Missing"} highlight={!parent2PassportPath} />
            <SummaryRow label="Vollmacht" value={vollmachtPath ? "Uploaded" : "Missing"} highlight={!vollmachtPath} />
            <SummaryRow label="Wellpass Consent" value={wellpassPath ? "Uploaded" : "Missing"} highlight={!wellpassPath} />
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="px-4 pb-8">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-1">
        {stepLabels.map((label, i) => {
          const Icon = stepIcons[i];
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                  isActive
                    ? "bg-[#ED1C24] text-white"
                    : isDone
                    ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                }`}
              >
                {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {stepLabels[step - 1]}
        </h2>
        {getStepContent()}
      </div>

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Navigation */}
      {step === 1 && (
        <button
          type="button"
          onClick={nextStep}
          className="mb-2 w-full text-center text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          Skip — I&apos;ll fill this in later
        </button>
      )}
      <div className="flex gap-3">
        {step > 1 && (
          <button type="button" onClick={prevStep} className="btn-secondary flex-1">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {step < totalSteps ? (
          <button type="button" onClick={nextStep} className="btn-primary flex-1">
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>Submit Onboarding</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const SummaryRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
    <span
      className={`text-sm font-medium ${
        highlight
          ? "text-amber-600 dark:text-amber-400"
          : "text-zinc-900 dark:text-zinc-100"
      }`}
    >
      {value}
    </span>
  </div>
);
