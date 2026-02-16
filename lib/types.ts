// Uses existing ITP tables — no separate onboarding tables

export type TrialProspect = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  position: string;
  nationality: string;
  current_club?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  travel_arrangements?: string;
  status: string;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  start_time?: string; // ISO timestamp e.g. 2026-03-02T09:00:00+01:00
  end_time?: string;   // ISO timestamp
  type: string;
  location?: string;
  all_day: boolean;
};

export type LocationCategory =
  | "housing"
  | "training"
  | "gym"
  | "dining"
  | "leisure";

export type ITPLocation = {
  id: string;
  itp_site: string;
  category: LocationCategory;
  name: string;
  address: string;
  maps_url: string | null;
};
