import {
  Home,
  Dumbbell,
  GraduationCap,
  Utensils,
  HeartPulse,
  TrainFront,
  TreePine,
  MapPin,
  ExternalLink,
} from "lucide-react";
import type { Location, LocationCategory } from "@/lib/types";

const categoryConfig: Record<
  LocationCategory,
  { label: string; icon: React.ElementType }
> = {
  housing: { label: "Housing", icon: Home },
  training: { label: "Training Facility", icon: MapPin },
  gym: { label: "Gym", icon: Dumbbell },
  language_school: { label: "Language School", icon: GraduationCap },
  dining: { label: "Dining", icon: Utensils },
  physio: { label: "Physio", icon: HeartPulse },
  train_station: { label: "Train Station", icon: TrainFront },
  leisure: { label: "Leisure", icon: TreePine },
};

export const LocationCard = ({ location }: { location: Location }) => {
  const config = categoryConfig[location.category];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {config.label}
        </p>
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {location.name}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {location.address}
        </p>
        {location.maps_url && (
          <a
            href={location.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-[#ED1C24] hover:underline"
          >
            Maps <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
};
