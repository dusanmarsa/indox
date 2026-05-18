import { PageHeadSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeadSkeleton />
      <TableSkeleton rows={4} cols={5} />
    </div>
  );
}
