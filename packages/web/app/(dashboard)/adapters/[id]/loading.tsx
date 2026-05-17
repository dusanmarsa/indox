import { AdapterDetailSkeleton, PageHeadSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeadSkeleton />
      <AdapterDetailSkeleton />
    </div>
  );
}
