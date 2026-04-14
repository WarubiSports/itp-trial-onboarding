import { supabase } from "@/lib/supabase";
import type { PlayerRecord } from "@/lib/resolvePlayer";
import { ContactsList } from "@/components/ContactsList";
import { sortContacts } from "@/lib/sortContacts";
import { DoorClosed } from "lucide-react";

type Props = {
  player: PlayerRecord;
  reason: "rejected" | "withdrawn";
};

/**
 * Farewell view for prospects whose trial journey ended without placement.
 * Shown when status is 'rejected' (we decided not to move forward) or
 * 'withdrawn' (they pulled out). Prevents the stale trial view that would
 * otherwise render — past schedule, dangling signing UI, hotel recs that
 * no longer apply.
 */
export const ClosedView = async ({ player, reason }: Props) => {
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

  const headline =
    reason === "rejected"
      ? `Thanks for the time you put in, ${player.first_name}.`
      : `All the best, ${player.first_name}.`;

  const body =
    reason === "rejected"
      ? "Your trial process with the ITP is closed. Circumstances change — if you'd like to stay in touch or reach out in the future, the contacts below know you and your game."
      : "Your trial process is closed. If your situation changes and you'd like to revisit the ITP down the road, the contacts below are the right place to start.";

  return (
    <div className="py-4 px-4 space-y-6">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <DoorClosed size={18} className="text-[var(--color-text-muted)]" />
          <h2 className="text-base font-bold text-[var(--color-text)]">
            {headline}
          </h2>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">{body}</p>
      </section>

      <ContactsList contacts={contacts} />

      <section className="text-center">
        <a
          href={`https://wa.me/491602717912?text=${encodeURIComponent(
            `Hi Thomas, it's ${player.first_name} ${player.last_name} — `
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
