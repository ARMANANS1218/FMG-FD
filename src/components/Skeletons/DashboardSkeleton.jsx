import React from 'react';

const DashboardSkeleton = () => {
  // Use semantic theme class names instead of manual dark/light checks
  const shimmerClass = 'bg-primary/10 animate-pulse';
  const containerClass = 'bg-background min-h-screen';
  const cardBg = 'bg-card';
  const borderColor = 'border-border';

  return (
    <div className={containerClass}>
      {/* Tabs Skeleton */}
      <div className={`border-b ${borderColor} ${cardBg} mb-6`}>
        <div className="px-4 md:px-6">
          <div className="flex gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-4 px-2">
                <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-2 md:p-6">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className={`h-8 w-48 rounded mb-3 ${shimmerClass}`}></div>
          <div className={`h-4 w-64 rounded ${shimmerClass}`}></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-full">
                  <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
                  <div className={`h-8 w-16 rounded ${shimmerClass}`}></div>
                </div>
                <div className={`h-10 w-10 rounded-full ${shimmerClass}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1 */}
          <div className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
            <div className={`h-6 w-48 rounded mb-6 ${shimmerClass}`}></div>
            <div className={`h-64 w-full rounded-lg ${shimmerClass}`}></div>
          </div>

          {/* Chart 2 */}
          <div className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
            <div className={`h-6 w-48 rounded mb-6 ${shimmerClass}`}></div>
            <div className={`h-64 w-full rounded-lg ${shimmerClass}`}></div>
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
          <div className={`h-6 w-48 rounded mb-6 ${shimmerClass}`}></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-16 w-full rounded-lg ${shimmerClass}`}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
