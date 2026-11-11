import { VehicleCardSkeleton } from "@/components/vehicles/VehicleCard";

export default function Loading() {
  return (
    <div className="container-gb py-8">
      <div className="skeleton h-9 w-48 rounded" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="skeleton hidden h-[560px] rounded-lg lg:block" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <VehicleCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
