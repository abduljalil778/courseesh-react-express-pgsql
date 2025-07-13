import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';

const ProfileInfoRowSkeleton = () => (
  <div className="grid grid-cols-3 gap-4">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-4 w-48 col-span-2" />
  </div>
);

export default function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl space-y-10 animate-pulse">
      {/* Skeleton untuk Header & Avatar */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-grow space-y-2 text-center sm:text-left">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <Separator />

      {/* Skeleton untuk Kartu Profil Publik */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-64 mt-2" /></CardDescription>
            </div>
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <ProfileInfoRowSkeleton />
          <ProfileInfoRowSkeleton />
          <ProfileInfoRowSkeleton />
          <ProfileInfoRowSkeleton />
        </CardContent>
      </Card>

      <Separator />

      {/* Skeleton untuk Kartu Keamanan */}
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-72 mt-2" /></CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}