/**
 * Single source of truth for ITP program calendar dates used in copy
 * and logic throughout the app. Update these values each season rather
 * than grepping for hardcoded strings.
 */

export const PRESEASON_START_DATE = "2026-07-06"; // YYYY-MM-DD (Berlin)

export function formatPreseasonStart(): string {
  const d = new Date(PRESEASON_START_DATE + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Calculates a player's age on preseason start (for U18 detection at the program phase). */
export function ageAtPreseason(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const preseason = new Date(PRESEASON_START_DATE + "T00:00:00");
  return Math.floor(
    (preseason.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}
