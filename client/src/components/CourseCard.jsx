// src/components/CourseCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StarRating from './StarRating';

const placeholderImage = "/placeholder-course.jpg"; // Sediakan gambar placeholder di folder public

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  if (!course) return null;

  const teacher = course.teacher;
  const imageUrl = course.imageUrl 
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${course.imageUrl}`
    : placeholderImage;
  
  const teacherAvatarUrl = teacher?.avatarUrl
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${teacher.avatarUrl}`
    : `https://ui-avatars.com/api/?name=${teacher?.name.replace(/\s/g, '+')}&background=random`;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full group">
      <div className="relative">
        <img src={imageUrl} alt={course.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 right-3 flex items-center space-x-[-12px]">
          {/* Tampilkan avatar guru (atau siswa yang mengambil, jika ada data itu) */}
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarImage src={teacherAvatarUrl} />
            <AvatarFallback>{teacher?.name?.charAt(0) || 'T'}</AvatarFallback>
          </Avatar>
          {/* Anda bisa menambahkan avatar lain di sini jika ada data */}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <p className="text-xs font-semibold text-indigo-600 uppercase mb-1">
          {course.classLevels?.join(', ') || 'General'}
        </p>
        <h3 className="text-md font-bold text-gray-800 leading-tight flex-grow Htruncate_custom">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1 mb-2">
          {teacher?.name || 'N/A'}
        </p>
        
        <div className="my-2">
          <StarRating rating={course.averageRating} totalReviews={course.totalReviews} size={14} />
        </div>
        
        <p className="text-xl font-bold text-gray-900">
          {formatCurrencyIDR(course.price)}
        </p>

        {/* Tombol akan muncul saat hover (opsional, untuk tampilan lebih bersih) */}
        <Button 
          onClick={() => navigate(`/student/courses/${course.id}`)}
          className="w-full mt-4"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}