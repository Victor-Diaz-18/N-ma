import React from "react";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="nb-border bg-white p-5 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
        <div className="md:col-span-3 nb-border bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="md:col-span-3 nb-border bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-20" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
        <div className="md:col-span-2 nb-border bg-white p-6 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-16" />
        </div>
        <div className="md:col-span-2 nb-border bg-white p-6 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 w-16" />
        </div>
        <div className="md:col-span-2 nb-border bg-white p-6 space-y-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <div className="grid sm:grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CourseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="nb-border bg-white overflow-hidden">
        <Skeleton className="h-32" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-28" />
        ))}
      </div>

      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="nb-border bg-white overflow-hidden">
      <div className="bg-[#1F5A2A] p-3">
        <div className="flex gap-4">
          {[...Array(cols)].map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 bg-gray-600" />
          ))}
        </div>
      </div>
      <div className="divide-y-2 divide-[#1F5A2A]">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              {[...Array(cols)].map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
