import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentPageSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8 animate-pulse">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
        <div className="text-center space-y-4">
          {/* Skeleton untuk ikon dan judul */}
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full mx-auto" />
        </div>

        <div className="mt-8 border-t pt-6 space-y-4">
          {/* Skeleton untuk Payment Details */}
          <Skeleton className="h-6 w-1/3" />
          <div className="space-y-2 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex justify-between mt-2">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-7 w-1/4" />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Skeleton untuk Payment Instructions */}
          <Skeleton className="h-6 w-1/3" />
          <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
            <Skeleton className="h-5 w-full" />
            <div className="p-4 border bg-white rounded-md flex items-center">
              <Skeleton className="h-8 w-12 mr-4" />
              <div className="space-y-2 flex-grow">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
             <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}