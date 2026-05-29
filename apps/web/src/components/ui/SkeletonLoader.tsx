import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded bg-gradient-to-r from-zinc-800 via-zinc-700/60 to-zinc-800 bg-[length:200%_100%]',
        className,
      )}
    />
  );
}

export function DeviceCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-2.5 w-20 rounded" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-14 rounded" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="space-y-1.5">
        <Skeleton className="h-2.5 w-20 rounded" />
        <Skeleton className="h-6 w-12 rounded" />
      </div>
    </div>
  );
}
