import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'metrics' | 'list';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 3,
  className = '',
}) => {
  if (type === 'metrics') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-white/10 rounded" />
              <div className="h-5 w-5 bg-white/10 rounded-full" />
            </div>
            <div className="h-7 w-16 bg-white/10 rounded mt-2" />
            <div className="h-2.5 w-32 bg-white/5 rounded mt-1" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`rounded-xl border border-white/10 bg-[#12121e] overflow-hidden p-4 space-y-4 animate-pulse ${className}`}>
        <div className="h-9 bg-white/5 rounded-lg w-full max-w-sm mb-4" />
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-14 bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-40 bg-white/10 rounded" />
                  <div className="h-2.5 w-24 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-3 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-60 rounded-2xl border border-white/10 bg-[#12121e] p-6 flex flex-col justify-between animate-pulse"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-4 w-12 bg-white/10 rounded-full" />
            </div>
            <div className="h-3 w-48 bg-white/5 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-white/5 rounded-full" />
            <div className="flex justify-between">
              <div className="h-2.5 w-16 bg-white/5 rounded" />
              <div className="h-2.5 w-16 bg-white/5 rounded" />
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <div className="h-3 w-20 bg-white/5 rounded" />
            <div className="h-6 w-20 bg-white/10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};
