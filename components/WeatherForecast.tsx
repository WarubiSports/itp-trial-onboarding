"use client";

import { useEffect, useState } from "react";

type DayForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  code: number;
};

const weatherIcons: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "🌨️",
  80: "🌦️", 81: "🌧️", 82: "🌧️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const getIcon = (code: number): string => weatherIcons[code] || "🌤️";

const formatDay = (dateStr: string): string => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export const WeatherForecast = ({ startDate, endDate }: { startDate: string; endDate: string }) => {
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Köln coordinates: 50.9375, 6.9603
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=50.9375&longitude=6.9603&daily=temperature_2m_max,temperature_2m_min,weather_code&start_date=${startDate}&end_date=${endDate}&timezone=Europe/Berlin`
        );
        if (!res.ok) return;
        const data = await res.json();
        const days: DayForecast[] = (data.daily?.time || []).map((date: string, i: number) => ({
          date,
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weather_code[i],
        }));
        setForecast(days);
      } catch {
        // Silently fail — weather is nice-to-have
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [startDate, endDate]);

  if (loading || forecast.length === 0) return null;

  return (
    <section className="px-4 pb-8">
      <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Weather in Cologne
      </h2>
      <div className={`grid gap-2 ${forecast.length === 1 ? "grid-cols-1" : forecast.length <= 3 ? `grid-cols-${forecast.length}` : "grid-cols-3"}`}>
        {forecast.map((day) => (
          <div
            key={day.date}
            className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <span className="text-2xl">{getIcon(day.code)}</span>
            <span className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {day.tempMax}° / {day.tempMin}°
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDay(day.date)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
