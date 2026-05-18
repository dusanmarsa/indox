import { PageHeadSkeleton, StackedFormSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeadSkeleton />
      <StackedFormSkeleton />
    </div>
  );
}
