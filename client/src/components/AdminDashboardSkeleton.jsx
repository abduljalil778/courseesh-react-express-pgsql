// src/components/skeletons/AdminDashboardSkeleton.jsx
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton untuk satu kartu statistik
const StatCardSkeleton = () => (
  <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="ml-4 flex-1 space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-12" />
    </div>
  </div>
);

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Skeleton untuk Kartu KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Skeleton untuk Grafik Utama */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="w-full h-[300px]" />
      </div>

      {/* Skeleton untuk Grafik Sekunder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Skeleton className="h-6 w-2/3 mb-4" />
          <div className="flex justify-center items-center h-[300px]">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg">
           <div className="bg-gray-50 px-4 py-3">
             <Skeleton className="h-5 w-1/2" />
           </div>
           <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
           </div>
        </div>
      </div>
    </div>
  );
}