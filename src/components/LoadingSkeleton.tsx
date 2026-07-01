"use client";

interface SkeletonCardProps {
  className?: string;
}

function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#12121f] border border-white/5 ${className}`}>
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-[#1a1a2e]">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#1a1a2e] rounded-full w-4/5 skeleton-shimmer" />
        <div className="flex items-center justify-between">
          <div className="h-2.5 bg-[#1a1a2e] rounded-full w-12 skeleton-shimmer" />
          <div className="h-2.5 bg-[#1a1a2e] rounded-full w-10 skeleton-shimmer" />
        </div>
        <div className="h-4 bg-[#1a1a2e] rounded-full w-20 skeleton-shimmer" />
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ count = 8, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`flex gap-4 overflow-hidden pb-4 px-4 md:px-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-none w-[160px] sm:w-[180px] md:w-[200px]">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div
      className="relative w-full bg-[#12121f] animate-pulse"
      style={{ height: "min(90vh, 700px)" }}
    >
      <div className="absolute inset-0 skeleton-shimmer" />
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 w-full">
          <div className="max-w-2xl space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-[#1a1a2e] skeleton-shimmer" />
              <div className="h-6 w-16 rounded-full bg-[#1a1a2e] skeleton-shimmer" />
            </div>
            <div className="h-14 w-3/4 rounded-lg bg-[#1a1a2e] skeleton-shimmer" />
            <div className="h-4 w-1/3 rounded-full bg-[#1a1a2e] skeleton-shimmer" />
            <div className="h-4 w-full rounded-full bg-[#1a1a2e] skeleton-shimmer" />
            <div className="h-4 w-5/6 rounded-full bg-[#1a1a2e] skeleton-shimmer" />
            <div className="flex gap-3 pt-4">
              <div className="h-12 w-32 rounded-full bg-[#1a1a2e] skeleton-shimmer" />
              <div className="h-12 w-32 rounded-full bg-[#1a1a2e] skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
