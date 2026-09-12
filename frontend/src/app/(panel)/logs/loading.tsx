import { SkeletonTable } from '@/components/Skeleton';

export default function LogsLoading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="animate-pulse rounded-xl bg-white/[0.04] h-10 w-48" />
      <SkeletonTable rows={12} />
    </div>
  );
}
