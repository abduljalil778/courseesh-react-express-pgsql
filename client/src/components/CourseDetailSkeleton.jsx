import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseDetailSkeleton() {
  return (
    <div className="bg-gray-100 animate-pulse">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 lg:gap-x-12">
          
          {/* Skeleton untuk Kolom Konten Utama */}
          <main className="lg:col-span-2 space-y-8">
            {/* Skeleton untuk Header */}
            <div>
              <Skeleton className="h-10 w-3/4" />
              <div className="flex items-center gap-4 mt-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>

            {/* Skeleton untuk Deskripsi & Poin Pembelajaran */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Skeleton untuk "Tentang Instruktur" */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>

            {/* Skeleton untuk "Ulasan Siswa" */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <div className="border-b pb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </main>

          {/* Skeleton untuk Kolom Sticky Sidebar */}
          <aside className="mt-10 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-9 w-1/2" />
                  <Skeleton className="h-12 w-full rounded-md" />
                  <div className="pt-2 space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}