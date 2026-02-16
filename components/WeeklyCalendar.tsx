"use client";

import { useState } from "react";
import type { ScheduleEntry, Location } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 56; // px per hour
const TOTAL_HOURS = END_HOUR - START_HOUR;

const defaultColors: Record<string, string> = {
  Training: "#22c55e",
  Gym: "#3b82f6",
  "German Class": "#f97316",
  Lunch: "#9ca3af",
  "Match Day": "#ED1C24",
  Physio: "#ef4444",
  "Free Time": "#e5e7eb",
};

const getColor = (entry: ScheduleEntry): string => {
  if (entry.color) return entry.color;
  return defaultColors[entry.title] || "#a78bfa";
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const formatTime = (time: string): string => {
  const [h, m] = time.split(":");
  return `${h}:${m}`;
};

const isLightColor = (hex: string): boolean => {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};

const getCurrentDayIndex = (): number => {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon, 6=Sun
};

export const WeeklyCalendar = ({
  entries,
  locations,
}: {
  entries: ScheduleEntry[];
  locations: Location[];
}) => {
  const [selected, setSelected] = useState<ScheduleEntry | null>(null);
  const today = getCurrentDayIndex();

  const locationMap = new Map(locations.map((l) => [l.category, l]));

  return (
    <section className="px-4 pb-8">
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Your Week
      </h2>

      {/* Day headers */}
      <div className="flex">
        <div className="w-10 shrink-0" />
        {DAYS.map((day, i) => (
          <div
            key={day}
            className={`flex-1 pb-2 text-center text-xs font-semibold ${
              i === today
                ? "text-[#ED1C24]"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div
          className="relative flex"
          style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
        >
          {/* Time axis */}
          <div className="relative w-10 shrink-0 border-r border-zinc-100 dark:border-zinc-700">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 w-full pr-1 text-right text-[10px] text-zinc-400"
                style={{ top: i * HOUR_HEIGHT - 6 }}
              >
                {(START_HOUR + i).toString().padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((_, dayIndex) => (
            <div
              key={dayIndex}
              className={`relative flex-1 border-r border-zinc-100 last:border-r-0 dark:border-zinc-700 ${
                dayIndex === today ? "bg-red-50/40 dark:bg-red-950/10" : ""
              }`}
            >
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-full border-t border-zinc-50 dark:border-zinc-750"
                  style={{ top: i * HOUR_HEIGHT }}
                />
              ))}

              {/* Schedule blocks */}
              {entries
                .filter((e) => e.day_of_week === dayIndex)
                .map((entry) => {
                  const startMin = timeToMinutes(entry.start_time);
                  const endMin = timeToMinutes(entry.end_time);
                  const top =
                    ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                  const color = getColor(entry);
                  const light = isLightColor(color);

                  return (
                    <button
                      key={entry.id}
                      onClick={() =>
                        setSelected(
                          selected?.id === entry.id ? null : entry
                        )
                      }
                      className="absolute left-0.5 right-0.5 cursor-pointer overflow-hidden rounded-md px-1 py-0.5 text-left transition-opacity hover:opacity-90"
                      style={{
                        top,
                        height: Math.max(height, 20),
                        backgroundColor: color,
                        color: light ? "#1f2937" : "#ffffff",
                      }}
                    >
                      <p className="truncate text-[10px] font-semibold leading-tight sm:text-xs">
                        {entry.title}
                      </p>
                      <p className="truncate text-[9px] leading-tight opacity-80 sm:text-[10px]">
                        {formatTime(entry.start_time)}
                      </p>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected entry tooltip */}
      {selected && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {selected.title}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {DAYS[selected.day_of_week]} {formatTime(selected.start_time)}{" "}
                &ndash; {formatTime(selected.end_time)}
              </p>
              {selected.location_category && (
                <>
                  {locationMap.get(selected.location_category) && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {locationMap.get(selected.location_category)!.name}
                      <span className="block text-xs text-zinc-400">
                        {locationMap.get(selected.location_category)!.address}
                      </span>
                    </p>
                  )}
                </>
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
