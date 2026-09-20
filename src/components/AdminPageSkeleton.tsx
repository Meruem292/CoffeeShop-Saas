import React from 'react';

export function AdminPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0a0a0c] p-6 rounded-3xl border border-black/10 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 shrink-0" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-white/10 rounded-lg" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-white/5 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-200 dark:bg-white/10 rounded-xl" />
          <div className="h-10 w-32 bg-amber-500/20 rounded-xl" />
        </div>
      </div>

      {/* Metrics / Filter Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white dark:bg-[#0a0a0c] rounded-3xl border border-black/10 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-7 w-24 bg-slate-200 dark:bg-white/15 rounded-lg" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-white/5 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white dark:bg-[#0a0a0c] p-6 rounded-3xl border border-black/10 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
          <div className="h-5 w-36 bg-slate-200 dark:bg-white/10 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-slate-200 dark:bg-white/10 rounded-xl" />
            <div className="h-9 w-24 bg-slate-200 dark:bg-white/10 rounded-xl" />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-slate-200 dark:bg-white/10 rounded-md" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-white/5 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-20 bg-slate-200 dark:bg-white/15 rounded-full" />
                <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
