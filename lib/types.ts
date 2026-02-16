export type Player = {
  id: string;
  name: string;
  itp_location: string;
  season: string;
  created_at: string;
};

export type LocationCategory =
  | "housing"
  | "training"
  | "gym"
  | "language_school"
  | "dining"
  | "physio"
  | "train_station"
  | "leisure";

export type Location = {
  id: string;
  player_id: string;
  category: LocationCategory;
  name: string;
  address: string;
  maps_url: string | null;
};

export type ScheduleEntry = {
  id: string;
  player_id: string;
  title: string;
  day_of_week: number; // 0 = Monday, 6 = Sunday
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  location_category: LocationCategory | null;
  color: string | null;
};
