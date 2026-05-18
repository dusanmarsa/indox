import { PageHeadSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeadSkeleton />
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}
