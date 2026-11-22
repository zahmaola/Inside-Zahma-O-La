import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function FeedbackLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-56" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
