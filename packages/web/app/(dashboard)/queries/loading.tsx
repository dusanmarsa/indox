import {
  ActivityChartSkeleton,
  PageHeadSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeadSkeleton />
      <ActivityChartSkeleton />
      <TableSkeleton rows={5} cols={3} />
    </div>
  );
}
