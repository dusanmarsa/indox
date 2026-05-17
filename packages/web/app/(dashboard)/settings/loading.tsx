import { PageHeadSkeleton, StackedFormSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="max-w-[680px]">
      <PageHeadSkeleton />
      <StackedFormSkeleton />
    </div>
  );
}
