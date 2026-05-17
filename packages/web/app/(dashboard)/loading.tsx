import {
  DashboardHeroSkeleton,
  FilterBarSkeleton,
  SourceCardsSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div>
      <DashboardHeroSkeleton />
      <FilterBarSkeleton />
      <SourceCardsSkeleton />
    </div>
  );
}
