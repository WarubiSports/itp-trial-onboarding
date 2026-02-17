"use client";

import type { CalendarEvent } from "@/lib/types";

// Map event type to color dot
const typeColors: Record<string, string> = {
  team_training: "#22c55e",
  individual_training: "#16a34a",
  training: "#22c55e",
  trial: "#22c55e",
  prospect_trial: "#22c55e",
  gym: "#3b82f6",
  match: "#ED1C24",
  tournament: "#ED1C24",
  video_session: "#6366f1",
  medical: "#ef4444",
  meeting: "#64748b",
  airport_pickup: "#06b6d4",
  team_activity: "#a78bfa",
  other: "#9ca3af",
  visa: "#64748b",
};

const getColor = (type: string): string => typeColors[type] || "#9ca3af";

const formatTime = (time?: string): string => {
  if (!time) return "";
  if (time.includes("T")) {
    const d = new Date(time);
    return d.toLocaleTimeString("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  const parts = time.split(":");
  return `${parts[0]}:${parts[1]}`;
};

// Timezone-safe date string
const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDayHeader = (dateStr: string): string => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

const getDateRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const current = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  while (current <= last) {
    dates.push(toDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const isToday = (dateStr: string): boolean => {
  return dateStr === toDateStr(new Date());
};

export const WeeklyCalendar = ({
  events,
  startDate,
  endDate,
}: {
  events: CalendarEvent[];
  startDate: string;
  endDate: string;
}) => {
  if (!startDate || !endDate) {
    return (
      <section className="px-4 pb-8">
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Your Schedule
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Trial dates not yet confirmed.
        </p>
      </section>
    );
  }

  const dates = getDateRange(startDate, endDate);

  // Group events by date
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = eventsByDate.get(event.date) || [];
    existing.push(event);
    eventsByDate.set(event.date, existing);
  }

  return (
    <section className="px-4 pb-8">
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Your Schedule
      </h2>

      <div className="flex flex-col gap-3">
        {dates.map((dateStr) => {
          const dayEvents = eventsByDate.get(dateStr) || [];
          const today = isToday(dateStr);

          return (
            <div
              key={dateStr}
              className={`rounded-xl border p-4 ${
                today
                  ? "border-[#ED1C24]/30 bg-red-50/50 dark:border-[#ED1C24]/20 dark:bg-red-950/10"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              }`}
            >
              {/* Day header */}
              <div className="mb-3 flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${
                    today
                      ? "text-[#ED1C24]"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {formatDayHeader(dateStr)}
                </p>
                {today && (
                  <span className="rounded-full bg-[#ED1C24] px-2 py-0.5 text-[10px] font-semibold text-white">
                    Today
                  </span>
                )}
              </div>

              {/* Events */}
              {dayEvents.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Rest day
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayEvents.map((event) => {
                    const color = getColor(event.type);
                    return (
                      <div key={event.id} className="flex items-start gap-3">
                        {/* Color dot */}
                        <div
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {event.title}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {formatTime(event.start_time)}
                            {event.end_time && (
                              <> &ndash; {formatTime(event.end_time)}</>
                            )}
                            {event.location && (
                              <> &middot; {event.location}</>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
