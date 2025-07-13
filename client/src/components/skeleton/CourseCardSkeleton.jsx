// src/components/CourseCardSkeleton.jsx
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      {/* Kerangka untuk Gambar */}
      <Skeleton className="h-40 w-full" />
      
      <div className="p-4 space-y-3">
        {/* Kerangka untuk Kategori */}
        <Skeleton className="h-4 w-1/3" />
        {/* Kerangka untuk Judul */}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        {/* Kerangka untuk Nama Guru */}
        <Skeleton className="h-3 w-1/2" />
        {/* Kerangka untuk Rating */}
        <Skeleton className="h-4 w-2/3" />
        {/* Kerangka untuk Harga */}
        <div className="pt-2">
            <Skeleton className="h-7 w-1/2" />
        </div>
      </div>
    </div>
  );
}