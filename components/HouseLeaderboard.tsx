import { Trophy } from "lucide-react";

type HouseRow = {
  id: string;
  name: string;
  total_points: number | null;
};

const medals = ["🥇", "🥈", "🥉"];

export const HouseLeaderboard = ({
  houses,
  myHouseId,
}: {
  houses: HouseRow[];
  myHouseId: string | null;
}) => {
  const maxPoints = Math.max(1, ...houses.map((h) => h.total_points ?? 0));

  return (
    <section>
      <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)] mb-3 flex items-center gap-2">
        <Trophy size={18} className="text-[var(--color-brand)]" />
        House Standings
      </h2>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-2">
        {houses.map((h, i) => {
          const pts = h.total_points ?? 0;
          const width = Math.round((pts / maxPoints) * 100);
          const isMine = h.id === myHouseId;
          return (
            <div
              key={h.id}
              className={`rounded-lg p-2.5 ${isMine ? "bg-[var(--color-brand-glow)] border border-[var(--color-brand)]/40" : ""}`}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{medals[i] ?? "·"}</span>
                  <span
                    className={`font-semibold truncate ${
                      isMine ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {h.name}
                  </span>
                  {isMine && (
                    <span className="text-[10px] text-[var(--color-brand)] uppercase tracking-wider font-bold">
                      You
                    </span>
                  )}
                </span>
                <span className="font-bold text-[var(--color-text)] shrink-0 ml-2">
                  {pts}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[#ff6b72] transition-all"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
