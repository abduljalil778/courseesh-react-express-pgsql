import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const SessionItemSkeleton = () => (
  <div className="p-4 border rounded-lg flex justify-between items-start">
    <div className="space-y-2 flex-grow">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    <Skeleton className="h-9 w-24 rounded-md shrink-0" />
  </div>
);

export default function CourseProgressSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Skeleton untuk Header */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
      </div>

      {/* Skeleton untuk Kartu Detail Sesi */}
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-7 w-48" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-32" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SessionItemSkeleton />
          <SessionItemSkeleton />
          <SessionItemSkeleton />
        </CardContent>
      </Card>
      
      {/* Skeleton untuk Kartu Laporan Akhir */}
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-7 w-56" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    </div>
  );
}