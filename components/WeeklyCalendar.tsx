"use client";

import type { CalendarEvent } from "@/lib/types";

type ContactInfo = {
  id: string;
  name: string;
  role?: string;
  organization?: string;
  photo_url?: string;
};

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

const typeIcons: Record<string, string> = {
  team_training: "⚽",
  training: "⚽",
  individual_training: "🏋️",
  gym: "🏋️",
  match: "🏟️",
  tournament: "🏟️",
  video_session: "🎬",
  medical: "🏥",
  airport_pickup: "✈️",
  team_activity: "👥",
};

const getIcon = (type: string): string | null => typeIcons[type] || null;

export const WeeklyCalendar = ({
  events,
  startDate,
  endDate,
  contactLookup = {},
}: {
  events: CalendarEvent[];
  startDate: string;
  endDate: string;
  contactLookup?: Record<string, ContactInfo>;
}) => {
  if (!startDate || !endDate) {
    return (
      <section className="px-4 pb-8">
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Your Schedule
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Visit dates not yet confirmed.
        </p>
      </section>
    );
  }

  const dates = getDateRange(startDate, endDate);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = eventsByDate.get(event.date) || [];
    existing.push(event);
    eventsByDate.set(event.date, existing);
  }
  for (const [, dayEvents] of eventsByDate) {
    dayEvents.sort((a, b) => {
      const timeA = formatTime(a.start_time);
      const timeB = formatTime(b.start_time);
      return timeA.localeCompare(timeB);
    });
  }

  // Resolve contacts for an event
  const getEventContacts = (event: CalendarEvent): ContactInfo[] => {
    const ids = (event.contact_ids && Array.isArray(event.contact_ids) && event.contact_ids.length > 0)
      ? event.contact_ids
      : event.contact_id ? [event.contact_id] : [];
    return ids.map(id => contactLookup[id]).filter((c): c is ContactInfo => !!c);
  };

  return (
    <section className="px-4 pb-8">
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Your Schedule
      </h2>

      <div className="flex flex-col gap-4">
        {dates.map((dateStr) => {
          const dayEvents = eventsByDate.get(dateStr) || [];
          const today = isToday(dateStr);

          return (
            <div key={dateStr}>
              {/* Day header */}
              <div className="mb-2 flex items-center gap-2">
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
                <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-3 dark:border-zinc-700">
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    No activities scheduled
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayEvents.map((event) => {
                    const contacts = getEventContacts(event);
                    const icon = getIcon(event.type);
                    const timeStr = formatTime(event.start_time);
                    const endTimeStr = formatTime(event.end_time);

                    return (
                      <div
                        key={event.id}
                        className={`rounded-xl border p-4 ${
                          today
                            ? "border-[#ED1C24]/20 bg-red-50/40 dark:border-[#ED1C24]/10 dark:bg-red-950/10"
                            : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Time column */}
                          {timeStr && (
                            <div className="flex w-12 shrink-0 flex-col items-center pt-0.5">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {timeStr}
                              </span>
                              {endTimeStr && (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                  {endTimeStr}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Divider */}
                          {timeStr && (
                            <div className="w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />
                          )}

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              {icon && <span className="text-base">{icon}</span>}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {event.title}
                                </p>
                                {event.location && (
                                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                                    📍 {event.location}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Contact chips with photos */}
                            {contacts.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {contacts.map((c) => (
                                  <div
                                    key={c.id}
                                    className="flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-1 pr-2.5 dark:bg-zinc-700"
                                  >
                                    {c.photo_url ? (
                                      <img
                                        src={c.photo_url}
                                        alt={c.name}
                                        className="h-5 w-5 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                        <span className="text-[9px] font-semibold text-[#ED1C24]">
                                          {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                      {c.name.split(" ")[0]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Fallback: legacy contact text if no structured contacts */}
                            {contacts.length === 0 && event.contact_name && (
                              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                                with {event.contact_name}
                              </p>
                            )}
                          </div>
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
