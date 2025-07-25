import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow flex items-center p-6 my-4 min-h-[112px]">
      <Skeleton className="w-24 h-24 rounded-xl mr-6" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/6" />
      </div>
      <Skeleton className="h-9 w-36 rounded-full ml-auto" />
    </div>
  );
};