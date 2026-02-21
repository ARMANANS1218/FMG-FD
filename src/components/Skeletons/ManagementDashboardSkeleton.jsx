import React, { useContext } from 'react';
import ColorModeContext from '../../context/ColorModeContext';

const ManagementDashboardSkeleton = () => {
  const shimmerClass = 'bg-muted animate-pulse';
  const containerClass = 'bg-background';
  const cardBg = 'bg-card';
  const borderColor = 'border-border';

  return (
    <div className={`min-h-screen ${containerClass} p-4 md:p-6`}>
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className={`h-8 w-64 rounded mb-3 ${shimmerClass}`}></div>
        <div className={`h-4 w-96 rounded ${shimmerClass}`}></div>
      </div>

      {/* Row 1: Employee Status Skeleton (4 cards) */}
      <div className="mb-6">
        <div className={`h-6 w-48 rounded mb-4 ${shimmerClass}`}></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-full">
                  <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
                  <div className={`h-8 w-16 rounded ${shimmerClass}`}></div>
                  <div className={`h-3 w-32 rounded ${shimmerClass}`}></div>
                </div>
                <div className={`h-10 w-10 rounded-lg ${shimmerClass}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Query Stats Skeleton (4 cards) */}
      <div className="mb-8">
        <div className={`h-6 w-48 rounded mb-4 ${shimmerClass}`}></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-full">
                  <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
                  <div className={`h-8 w-16 rounded ${shimmerClass}`}></div>
                  <div className={`h-3 w-32 rounded ${shimmerClass}`}></div>
                </div>
                <div className={`h-10 w-10 rounded-lg ${shimmerClass}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Overview Skeleton (3 cards) */}
      <div className="mb-8">
        <div className={`h-6 w-48 rounded mb-4 ${shimmerClass}`}></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-full">
                  <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
                  <div className={`h-8 w-16 rounded ${shimmerClass}`}></div>
                  <div className={`h-3 w-32 rounded ${shimmerClass}`}></div>
                </div>
                <div className={`h-10 w-10 rounded-lg ${shimmerClass}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Performance Skeleton (5 cards) */}
      <div className="mb-8">
        <div className={`h-6 w-48 rounded mb-4 ${shimmerClass}`}></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-full">
                  <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
                  <div className={`h-8 w-16 rounded ${shimmerClass}`}></div>
                  <div className={`h-3 w-32 rounded ${shimmerClass}`}></div>
                </div>
                <div className={`h-10 w-10 rounded-lg ${shimmerClass}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QA Performance Skeleton (6 cards) */}
      <div className="mb-8">
        <div className={`h-6 w-48 rounded mb-4 ${shimmerClass}`}></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-full">
                  <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
                  <div className={`h-8 w-16 rounded ${shimmerClass}`}></div>
                  <div className={`h-3 w-32 rounded ${shimmerClass}`}></div>
                </div>
                <div className={`h-10 w-10 rounded-lg ${shimmerClass}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TL Performance Skeleton (6 cards) */}
      <div className="mb-8">
        <div className={`h-6 w-48 rounded mb-4 ${shimmerClass}`}></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`p-6 rounded-xl border ${borderColor} ${cardBg} shadow-sm`}>
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-full">
                  <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
                  <div className={`h-8 w-16 rounded ${shimmerClass}`}></div>
                  <div className={`h-3 w-32 rounded ${shimmerClass}`}></div>
                </div>
                <div className={`h-10 w-10 rounded-lg ${shimmerClass}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Status Overview Skeleton */}
      <div className={`rounded-xl border ${borderColor} ${cardBg} shadow-sm overflow-hidden`}>
        <div className={`p-6 border-b ${borderColor}`}>
          <div className={`h-6 w-48 rounded ${shimmerClass}`}></div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border ${borderColor} bg-muted/30`}
              >
                <div className={`w-10 h-10 rounded-full ${shimmerClass}`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-24 rounded ${shimmerClass}`}></div>
                  <div className={`h-3 w-16 rounded ${shimmerClass}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboardSkeleton;
