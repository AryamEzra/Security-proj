"use client";

interface LoadingSkeletonProps {}

export function LoadingSkeleton({}: LoadingSkeletonProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  );
}
