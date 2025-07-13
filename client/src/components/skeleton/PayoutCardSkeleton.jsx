// src/components/skeletons/PayoutCardSkeleton.jsx
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function PayoutCardSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden animate-pulse">
      {/* Skeleton untuk Header Kartu */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      {/* Skeleton untuk Konten Utama Kartu */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Bagian Info Kursus */}
        <div className="md:col-span-2 flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-md shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        {/* Bagian Info Nominal */}
        <div className="text-left md:text-right space-y-2">
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-8 w-32 ml-auto" />
        </div>
      </div>

      {/* Skeleton untuk Footer (Tombol) */}
      <div className="px-5 py-3 flex items-center justify-end gap-3">
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}