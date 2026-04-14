import { supabase } from "@/lib/supabase";
import type { PlayerRecord } from "@/lib/resolvePlayer";
import { ContactsList } from "@/components/ContactsList";
import { sortContacts } from "@/lib/sortContacts";
import { Trophy } from "lucide-react";

type Props = {
  player: PlayerRecord;
  alumniDestination?: string | null;
};

/**
 * Alumni view — shown for players whose status has moved to 'alumni'.
 * No active schedule, no chores/wellness/grocery CTAs; just a warm
 * send-off and a reference to key contacts if they need anything.
 */
export const AlumniView = async ({ player, alumniDestination }: Props) => {
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

  return (
    <div className="py-4 px-4 space-y-6">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={18} className="text-[var(--color-brand)]" />
          <h2 className="text-base font-bold text-[var(--color-text)]">
            Thanks for being part of the ITP, {player.first_name}.
          </h2>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Your program with 1. FC Köln is complete.
          {alumniDestination
            ? ` Next up: ${alumniDestination}. All the best with it.`
            : " Wishing you all the best with whatever is next."}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-3">
          This page stays as a reference. If you need anything — a reference,
          a connection, a visit back in Köln — reach out to any of us below.
          You&apos;re always part of the ITP network.
        </p>
      </section>

      <ContactsList contacts={contacts} />

      <section className="text-center">
        <a
          href={`https://wa.me/491602717912?text=${encodeURIComponent(
            `Hi Thomas, it's ${player.first_name} ${player.last_name} from the ITP — `
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)] hover:underline"
        >
          Message Thomas on WhatsApp →
        </a>
      </section>
    </div>
  );
};
