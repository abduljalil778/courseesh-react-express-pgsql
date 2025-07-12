import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';

export default function TeacherProfileSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Skeleton untuk Kolom Kiri (Profil) */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
              <Skeleton className="h-32 w-32 mx-auto rounded-full border-4 border-white -mt-24" />
              <div className="text-center mt-4 space-y-2">
                <Skeleton className="h-7 w-3/4 mx-auto" />
                <Skeleton className="h-5 w-1/2 mx-auto" />
                <Skeleton className="h-4 w-1/3 mx-auto" />
              </div>
              <Separator className="my-6" />
              <div className="flex justify-around">
                <div className="text-center space-y-1">
                  <Skeleton className="h-6 w-8 mx-auto" />
                  <Skeleton className="h-4 w-12 mx-auto" />
                </div>
                <div className="text-center space-y-1">
                  <Skeleton className="h-6 w-8 mx-auto" />
                  <Skeleton className="h-4 w-12 mx-auto" />
                </div>
              </div>
            </div>
          </aside>

          {/* Skeleton untuk Kolom Kanan (Konten) */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-6">
            <Card>
              <CardHeader><CardTitle><Skeleton className="h-6 w-32" /></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>

            <Card>
               <CardHeader><CardTitle><Skeleton className="h-6 w-40" /></CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-48" />
              </CardContent>
            </Card>

            <div className="mt-2">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gunakan skeleton kartu kursus yang sudah ada */}
                <div className="bg-white rounded-lg shadow-md p-4 space-y-3"><Skeleton className="h-40 w-full"/><Skeleton className="h-4 w-1/3"/><Skeleton className="h-5 w-full"/><Skeleton className="h-4 w-1/2"/></div>
                <div className="bg-white rounded-lg shadow-md p-4 space-y-3"><Skeleton className="h-40 w-full"/><Skeleton className="h-4 w-1/3"/><Skeleton className="h-5 w-full"/><Skeleton className="h-4 w-1/2"/></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}