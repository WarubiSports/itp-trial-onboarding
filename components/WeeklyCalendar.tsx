"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/lib/types";

const HOUR_HEIGHT = 56;

// Map calendar_events.type to display colors
const typeColors: Record<string, string> = {
  team_training: "#22c55e",
  individual_training: "#16a34a",
  training: "#22c55e",
  trial: "#22c55e",
  prospect_trial: "#22c55e",
  gym: "#3b82f6",
  recovery: "#8b5cf6",
  match: "#ED1C24",
  tournament: "#ED1C24",
  language_class: "#f97316",
  school: "#f97316",
  video_session: "#6366f1",
  medical: "#ef4444",
  meeting: "#64748b",
  airport_pickup: "#06b6d4",
  team_activity: "#a78bfa",
  other: "#9ca3af",
  visa: "#64748b",
};

const getColor = (type: string): string => typeColors[type] || "#9ca3af";

// Short labels for narrow mobile columns
const shortLabels: Record<string, string> = {
  team_training: "Train",
  individual_training: "Indiv",
  training: "Train",
  trial: "Trial",
  prospect_trial: "Trial",
  gym: "Gym",
  recovery: "Recov",
  match: "Match",
  tournament: "Match",
  language_class: "Lang",
  school: "School",
  video_session: "Video",
  medical: "Med",
  meeting: "Meet",
  airport_pickup: "Pickup",
  team_activity: "Team",
  other: "Other",
  visa: "Visa",
};

const getShortLabel = (event: CalendarEvent): string =>
  shortLabels[event.type] || event.title.split(" ")[0];

const isLightColor = (hex: string): boolean => {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};

const parseTime = (time?: string): number | null => {
  if (!time) return null;
  // Handle ISO timestamps (2026-03-02T09:00:00+01:00) and plain "HH:MM"
  if (time.includes("T")) {
    const d = new Date(time);
    // Extract hours/minutes in Europe/Berlin timezone
    const parts = d.toLocaleTimeString("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hour12: false }).split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  const parts = time.split(":");
  if (parts.length < 2) return null;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
};

const formatTime = (time?: string): string => {
  if (!time) return "";
  if (time.includes("T")) {
    const d = new Date(time);
    return d.toLocaleTimeString("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const parts = time.split(":");
  return `${parts[0]}:${parts[1]}`;
};

const formatDayHeader = (dateStr: string): { day: string; date: string } => {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
};

// Get all dates between start and end (inclusive)
const getDateRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const current = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (current <= last) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
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
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

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

  // Dynamic hour range from actual events (±1 hour padding)
  let minHour = 9;
  let maxHour = 18;
  for (const event of events) {
    const s = parseTime(event.start_time);
    const e = parseTime(event.end_time);
    if (s !== null) minHour = Math.min(minHour, Math.floor(s / 60));
    if (e !== null) maxHour = Math.max(maxHour, Math.ceil(e / 60));
  }
  const startHour = Math.max(minHour - 1, 0);
  const endHour = Math.min(maxHour + 1, 24);
  const totalHours = endHour - startHour;

  return (
    <section className="px-4 pb-8">
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Your Schedule
      </h2>

      {/* Day headers */}
      <div className="flex">
        <div className="w-10 shrink-0" />
        {dates.map((dateStr) => {
          const { day, date } = formatDayHeader(dateStr);
          const today = isToday(dateStr);
          return (
            <div
              key={dateStr}
              className={`flex-1 pb-2 text-center ${
                today ? "text-[#ED1C24]" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <div className="text-xs font-semibold">{day}</div>
              <div className="text-[10px]">{date}</div>
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div
          className="relative flex"
          style={{ height: totalHours * HOUR_HEIGHT }}
        >
          {/* Time axis */}
          <div className="relative w-10 shrink-0 border-r border-zinc-100 dark:border-zinc-700">
            {Array.from({ length: totalHours }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 w-full pr-1 text-right text-[10px] text-zinc-400"
                style={{ top: i * HOUR_HEIGHT - 6 }}
              >
                {(startHour + i).toString().padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dates.map((dateStr) => {
            const dayEvents = eventsByDate.get(dateStr) || [];
            const today = isToday(dateStr);

            return (
              <div
                key={dateStr}
                className={`relative flex-1 border-r border-zinc-100 last:border-r-0 dark:border-zinc-700 ${
                  today ? "bg-red-50/40 dark:bg-red-950/10" : ""
                }`}
              >
                {/* Hour lines */}
                {Array.from({ length: totalHours }, (_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 w-full border-t border-zinc-50 dark:border-zinc-750"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}

                {/* Event blocks */}
                {dayEvents.map((event) => {
                  const startMin = parseTime(event.start_time);
                  const endMin = parseTime(event.end_time);

                  if (startMin === null || endMin === null) return null;

                  const top =
                    ((startMin - startHour * 60) / 60) * HOUR_HEIGHT;
                  const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                  const color = getColor(event.type);
                  const light = isLightColor(color);

                  return (
                    <button
                      key={event.id}
                      onClick={() =>
                        setSelected(
                          selected?.id === event.id ? null : event
                        )
                      }
                      className="absolute left-0.5 right-0.5 cursor-pointer overflow-hidden rounded-md px-1 py-0.5 text-left transition-opacity hover:opacity-90"
                      style={{
                        top: Math.max(top, 0),
                        height: Math.max(height, 20),
                        backgroundColor: color,
                        color: light ? "#1f2937" : "#ffffff",
                      }}
                    >
                      <p className="truncate text-[10px] font-semibold leading-tight sm:hidden">
                        {getShortLabel(event)}
                      </p>
                      <p className="hidden truncate text-xs font-semibold leading-tight sm:block">
                        {event.title}
                      </p>
                      <p className="truncate text-[9px] leading-tight opacity-80 sm:text-[10px]">
                        {formatTime(event.start_time)}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected event tooltip */}
      {selected && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {selected.title}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatDayHeader(selected.date).day}{" "}
                {formatDayHeader(selected.date).date}
                {selected.start_time && selected.end_time && (
                  <>
                    {" "}
                    {formatTime(selected.start_time)} &ndash;{" "}
                    {formatTime(selected.end_time)}
                  </>
                )}
              </p>
              {selected.location && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {selected.location}
                </p>
              )}
              {selected.description && (
                <p className="mt-1 text-xs text-zinc-400">
                  {selected.description}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="ml-4 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
