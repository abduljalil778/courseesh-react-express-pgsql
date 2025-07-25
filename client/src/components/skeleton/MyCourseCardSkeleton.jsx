import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function MyCourseCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col p-5">
      <div className="flex justify-between items-start mb-2">
        {/* Skeleton untuk Badge Status */}
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      
      {/* Skeleton untuk Judul */}
      <Skeleton className="h-6 w-3/4 mt-2" />
      
      {/* Skeleton untuk Nama Guru */}
      <Skeleton className="h-4 w-1/2 mt-3 mb-3" />
      
      {/* Skeleton untuk Progress Bar */}
      <Skeleton className="h-2.5 w-full rounded-full" />
      <Skeleton className="h-3 w-1/3 mx-auto mt-2 mb-4" />
      
      {/* Skeleton untuk Link "View Details" */}
      <div className="mt-auto">
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
    </div>
  );
}