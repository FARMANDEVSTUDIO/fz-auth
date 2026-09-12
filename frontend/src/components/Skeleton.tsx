'use client';

function Bone({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass rounded-xl p-5 space-y-3 ${className}`}>
      <Bone className="h-4 w-1/3" />
      <Bone className="h-8 w-1/2" />
      <Bone className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-edge/50">
        <Bone className="h-4 w-40" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Bone className="h-8 w-8 rounded-full flex-shrink-0" />
            <Bone className="h-4 flex-1" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Bone className="h-10 w-64" />
      <SkeletonStats count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonTable rows={4} />
        <SkeletonTable rows={4} />
      </div>
    </div>
  );
}
