/**
 * Grocery delivery schedule (ported from ITP-Player-App/src/lib/data-service.js:1830+).
 *
 * - Delivery: every Tuesday and Friday, 6–8 PM Berlin.
 * - Deadline: 8 AM Berlin on the day before delivery (Mon for Tue, Thu for Fri).
 * - Weekly budget per player: €35.
 */

export const GROCERY_BUDGET = 35.0;

export type DeliveryOption = {
  date: string; // YYYY-MM-DD
  dayName: "Tuesday" | "Friday";
  formattedDate: string; // DD/MM/YYYY
  deadlineText: string;
  expired: boolean;
};

/** Date (YYYY-MM-DD) and weekday in Berlin timezone. */
function berlinDateParts(d: Date) {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(d);

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  return { ymd, weekday: dayMap[weekday] ?? 0 };
}

function formatDisplay(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function isDeadlinePassed(deliveryYmd: string): boolean {
  const [y, m, d] = deliveryYmd.split("-").map(Number);
  const deadline = new Date(Date.UTC(y, m - 1, d, 7, 0, 0)); // 8 AM Berlin CET ≈ 7 UTC
  // Deadline is 1 day before delivery at 8 AM Berlin. Convert to UTC approximation.
  // We compute by subtracting a day and comparing in Berlin.
  const deadlineDay = new Date(deadline);
  deadlineDay.setUTCDate(deadlineDay.getUTCDate() - 1);

  const now = new Date();
  return now.getTime() > deadlineDay.getTime();
}

function formatDeadline(deliveryYmd: string): string {
  const [y, m, d] = deliveryYmd.split("-").map(Number);
  const deliveryDate = new Date(Date.UTC(y, m - 1, d));
  deliveryDate.setUTCDate(deliveryDate.getUTCDate() - 1);

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(deliveryDate);

  return `${weekday} 8 AM`;
}

/**
 * Returns the next 4 available Tue/Fri delivery options.
 * Each option includes whether the order deadline has passed.
 */
export function getDeliveryDates(): DeliveryOption[] {
  const options: DeliveryOption[] = [];
  const now = new Date();

  for (let i = 0; i < 30 && options.length < 4; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const { ymd, weekday } = berlinDateParts(date);

    if (weekday === 2 || weekday === 5) {
      options.push({
        date: ymd,
        dayName: weekday === 2 ? "Tuesday" : "Friday",
        formattedDate: formatDisplay(date),
        deadlineText: formatDeadline(ymd),
        expired: isDeadlinePassed(ymd),
      });
    }
  }

  return options;
}
