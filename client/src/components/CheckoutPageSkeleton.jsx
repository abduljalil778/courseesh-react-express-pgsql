// src/components/skeletons/CheckoutPageSkeleton.jsx
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CheckoutPageSkeleton() {
  return (
    <div className="bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="container mx-auto max-w-6xl">
        {/* Skeleton untuk Breadcrumb & Tombol Back */}
        <div className="mb-6 h-6 w-48 rounded-md bg-gray-200" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Kolom Kiri: Form */}
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-10 w-1/3" />
            
            {/* Skeleton untuk Kartu Form */}
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kolom Kanan: Ringkasan Pesanan */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-56">
              <Skeleton className="h-7 w-2/3 mb-6" />
              <div className="space-y-4 border-b pb-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="space-y-4 border-t mt-4 pt-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-1/2 ml-auto" />
              </div>
              <Skeleton className="h-12 w-full mt-6 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}