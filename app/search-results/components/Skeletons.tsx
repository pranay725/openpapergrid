import React from 'react';

export const FilterSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="border-b p-4">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

export const ResultSkeleton = () => (
  <div className="border-b border-gray-200 py-4 animate-pulse">
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8">
        <div className="h-4 bg-gray-200 rounded w-6"></div>
      </div>
      <div className="flex-1">
        <div className="mb-2">
          <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        </div>
        <div className="mb-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="mt-2 flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  </div>
);

export const HeaderSkeleton = () => (
  <div className="mb-4 flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="flex items-center gap-2">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="h-8 bg-gray-200 rounded w-8"></div>
      <div className="h-4 bg-gray-200 rounded w-12"></div>
      <div className="h-8 bg-gray-200 rounded w-12"></div>
      <div className="h-4 bg-gray-200 rounded w-12"></div>
      <div className="h-8 bg-gray-200 rounded w-8"></div>
      <div className="h-8 bg-gray-200 rounded w-8"></div>
    </div>
  </div>
); 