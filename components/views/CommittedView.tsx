import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { TrialProspect, ITPLocation } from "@/lib/types";
import { DocumentStatus } from "@/components/DocumentStatus";
import { PaymentSection } from "@/components/PaymentSection";
import { ContactsList } from "@/components/ContactsList";
import { LocationsList } from "@/components/LocationsList";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { sortContacts, STAFF_LOCATION_NAMES } from "@/lib/sortContacts";
import { ageAtPreseason, formatPreseasonStart } from "@/lib/programCalendar";

type Props = {
  prospect: TrialProspect;
};

/**
 * Committed sub-phase view: accepted/placed trial prospects waiting to be
 * promoted. They've completed the trial, signed the required docs, and now
 * need to handle pre-program items: payment, passport for visa, U18 legal
 * forms (Vollmacht + Wellpass), and housing confirmation.
 *
 * What's hidden vs the trial view:
 * - Hotel recommendations (they'll have housing)
 * - Trial schedule / weather (trial is over)
 * - Travel form (trial travel is done)
 * - Signing CTA as primary action (docs should already be signed)
 */
export const CommittedView = async ({ prospect }: Props) => {
  const playerId = prospect.id;

  // Signed documents — should be complete from trial, but verify.
  const { data: signedDocsData } = await supabase
    .from("player_documents")
    .select("document_type, document_title, signed_at, signer_name")
    .eq("player_id", playerId);

  const signedDocs = (signedDocsData || []) as {
    document_type: string;
    document_title: string;
    signed_at: string;
    signer_name: string;
  }[];

  // Locations for Köln — exclude staff-only working locations
  const { data: locationsData } = await supabase
    .from("itp_locations")
    .select("*")
    .eq("itp_site", "Köln")
    .not("name", "in", `(${STAFF_LOCATION_NAMES.map((n) => `"${n}"`).join(",")})`);

  let locations = (locationsData || []) as ITPLocation[];

  // Override housing based on room assignment, else show TBC
  if (prospect.room_id) {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("name, house_id")
      .eq("id", prospect.room_id)
      .single();
    if (roomData) {
      const { data: houseData } = await supabase
        .from("houses")
        .select("name, address, maps_url")
        .eq("id", roomData.house_id)
        .single();
      if (houseData) {
        locations = locations.map((loc) =>
          loc.category === "housing"
            ? {
                ...loc,
                name: `${houseData.name} — ${roomData.name}`,
                address: houseData.address || "",
                maps_url: houseData.maps_url || loc.maps_url,
              }
            : loc
        );
      }
    }
  } else {
    locations = locations.map((loc) =>
      loc.category === "housing"
        ? {
            ...loc,
            name: "Housing — to be confirmed",
            address: "Our team will confirm your housing before arrival.",
            maps_url: null,
          }
        : loc
    );
  }

  // ITP staff contacts
  const { data: staffContacts } = await supabase
    .from("itp_contacts")
    .select("name, role, organization, photo_url, nationality")
    .in("role", [
      "Project Manager",
      "Project Manager / Coach",
      "Head of Player Development",
    ])
    .order("name");

  const contacts = sortContacts(staffContacts || []).map(
    (c: {
      name: string;
      role?: string;
      organization?: string;
      photo_url?: string;
      nationality?: string;
    }) => ({
      name: c.name,
      role: c.role || "",
      organization: c.organization,
      photo_url: c.photo_url,
      nationality: c.nationality,
    })
  );

  // U18 at preseason start — drives which upload items are required.
  const isUnder18 = ageAtPreseason(prospect.date_of_birth) < 18;

  const passportUploaded = !!prospect.passport_file_path;
  const parent1PassportUploaded = !!prospect.parent1_passport_file_path;
  const vollmachtUploaded = !!prospect.vollmacht_file_path;
  const wellpassUploaded = !!prospect.wellpass_consent_file_path;

  const onboardingItems: { label: string; done: boolean; required: boolean }[] = [
    { label: "Passport (bio page)", done: passportUploaded, required: true },
  ];
  if (isUnder18) {
    onboardingItems.push(
      { label: "Parent passport", done: parent1PassportUploaded, required: true },
      { label: "Vollmacht (signed)", done: vollmachtUploaded, required: true },
      { label: "Wellpass consent (signed)", done: wellpassUploaded, required: true }
    );
  }

  const allOnboardingDone = onboardingItems.every((i) => !i.required || i.done);
  const remainingOnboardingCount = onboardingItems.filter((i) => i.required && !i.done).length;

  return (
    <>
      {/* Welcome / next-steps headline */}
      <section className="px-4 pt-2 pb-4">
        <div className="rounded-xl border border-green-700/30 bg-green-900/20 p-4">
          <p className="text-sm font-semibold text-green-300">
            You&apos;re in. Welcome to the ITP.
          </p>
          <p className="text-sm text-green-300/80 mt-1">
            Here&apos;s what&apos;s left to complete before preseason on {formatPreseasonStart()}.
          </p>
        </div>
      </section>

      {/* Signing status — includes program-only docs (Program Agreement, Housing) on top of the trial 3 */}
      <DocumentStatus signedDocs={signedDocs} playerId={playerId} phase="program" />

      {/* Payment */}
      <PaymentSection
        paymentLink={prospect.payment_link}
        paymentAmount={prospect.payment_amount}
        paymentStatus={prospect.payment_status}
      />

      {/* Documents to upload (passport, U18 forms) */}
      <section className="px-4 pb-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-[var(--color-brand)]" />
            <h3 className="text-sm font-bold text-[var(--color-text)]">
              Documents to Upload
            </h3>
          </div>
          {allOnboardingDone ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              <p className="text-sm text-green-400">
                All documents uploaded. Thank you.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {remainingOnboardingCount} item
                  {remainingOnboardingCount === 1 ? "" : "s"} remaining
                </p>
                {isUnder18 && (
                  <span className="text-xs text-amber-400">U18 requirements</span>
                )}
              </div>
              <ul className="space-y-1.5 mb-3">
                {onboardingItems.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 text-sm"
                  >
                    {item.done ? (
                      <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    )}
                    <span
                      className={
                        item.done
                          ? "text-[var(--color-text-muted)]"
                          : "text-[var(--color-text)]"
                      }
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/${playerId}/onboarding`}
                className="block text-center text-sm font-semibold text-[var(--color-brand)] hover:underline"
              >
                Complete uploads →
              </Link>
            </>
          )}
        </div>
      </section>

      <LocationsList locations={locations} />
      <ContactsList contacts={contacts} />

      {/* Emergency */}
      <section className="px-4 pb-8">
        <h2 className="mb-3 text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)]">
          Good to Know
        </h2>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
          <a
            href={`https://wa.me/491602717912?text=${encodeURIComponent(
              `Hi Thomas, I'm ${prospect.first_name} ${prospect.last_name} and I've been accepted to the ITP. I have a question:`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 transition-colors active:bg-[var(--color-surface-elevated)]"
          >
            <span className="text-lg">💬</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Message Thomas on WhatsApp
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Questions about preseason? We&apos;re here to help.
              </p>
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">→</span>
          </a>

          <details>
            <summary className="flex cursor-pointer items-center gap-3 p-4 text-sm font-medium text-[var(--color-text)]">
              <span className="text-lg">🚨</span>
              <span className="flex-1">Emergency Information</span>
              <span className="text-xs text-[var(--color-text-muted)]">Tap to expand</span>
            </summary>
            <div className="space-y-2 px-4 pb-4 pt-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)]">Emergency</span>
                <a href="tel:112" className="font-medium text-[var(--color-brand)]">
                  112
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)]">Thomas</span>
                <a href="tel:+491602717912" className="text-blue-400 underline">
                  +49 160 2717912
                </a>
              </div>
            </div>
          </details>
        </div>
      </section>
    </>
  );
};
