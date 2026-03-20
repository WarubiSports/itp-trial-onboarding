// Uses existing ITP tables — no separate onboarding tables

export type TrialProspect = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  position: string;
  nationality: string;
  current_club?: string;
  email?: string;
  phone?: string;
  parent_name?: string;
  parent_contact?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  travel_arrangements?: string;
  status: string;
  scout_id?: string;
  created_at: string;
  // Onboarding fields
  equipment_size?: string;
  arrival_date?: string;
  arrival_time?: string;
  flight_number?: string;
  arrival_airport?: string;
  needs_pickup?: boolean;
  pickup_location?: string;
  whatsapp_number?: string;
  schengen_last_180_days?: boolean;
  schengen_entry_date?: string;
  schengen_days_spent?: number;
  is_under_18?: boolean;
  passport_file_path?: string;
  parent1_passport_file_path?: string;
  parent2_passport_file_path?: string;
  vollmacht_file_path?: string;
  wellpass_consent_file_path?: string;
  onboarding_step?: number;
  onboarding_completed_at?: string;
  travel_submitted_at?: string;
  room_id?: string;
  accommodation_type?: string;
  accommodation_notes?: string;
  accommodation_details?: string;
};

export type OnboardingFormData = {
  // Step 1: Travel
  arrival_date: string;
  arrival_time: string;
  flight_number: string;
  arrival_airport: string;
  needs_pickup: boolean;
  whatsapp_number: string;
  // Step 2: Equipment & Schengen
  equipment_size: string;
  schengen_last_180_days: boolean | null;
  schengen_entry_date: string;
  schengen_days_spent: number | null;
  // Step 3: Documents (file paths set via upload)
  // Step 4: U18 Forms (conditional)
  // Step 5: Confirm & submit
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
  contact_name?: string;
  contact_role?: string;
};

export type Visitor = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  organization?: string;
  role: string;
  visit_start_date: string;
  visit_end_date: string;
  purpose?: string;
  notes?: string;
  travel_arrangements?: string;
  arrival_date?: string;
  arrival_time?: string;
  flight_number?: string;
  arrival_airport?: string;
  needs_pickup?: boolean;
  pickup_location?: string;
  whatsapp_number?: string;
  travel_submitted_at?: string;
  created_at: string;
  updated_at: string;
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
