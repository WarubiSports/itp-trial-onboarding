import type { ITPLocation, LocationCategory } from "@/lib/types";
import { LocationCard } from "./LocationCard";

const categoryOrder: LocationCategory[] = [
  "housing",
  "training",
  "gym",
  "language_school",
  "dining",
  "physio",
  "train_station",
  "leisure",
];

export const LocationsList = ({ locations }: { locations: ITPLocation[] }) => {
  const sorted = categoryOrder
    .map((cat) => locations.find((l) => l.category === cat))
    .filter((l): l is ITPLocation => l !== undefined);

  if (sorted.length === 0) return null;

  return (
    <section className="px-4 pb-12">
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Key Locations
      </h2>
      <div className="flex flex-col gap-3">
        {sorted.map((location) => (
          <LocationCard key={location.id} location={location} />
        ))}
      </div>
    </section>
  );
};
