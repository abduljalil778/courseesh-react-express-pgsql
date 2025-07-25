// src/components/CourseCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StarRating from './StarRating';
import { Edit, Trash2 } from 'lucide-react';

const placeholderImage = "/placeholder-course.jpg";

// Komponen Wrapper untuk membuatnya bisa diklik secara kondisional
const CardWrapper = ({ course, showActions, children }) => {
  if (showActions) {
    // Untuk guru, kartu tidak bisa diklik agar tidak mengganggu tombol Edit/Delete
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full border border-transparent">
        {children}
      </div>
    );
  }

  // Untuk siswa, seluruh kartu adalah sebuah link yang interaktif
  return (
    <Link 
      to={`/student/courses/${course.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {children}
    </Link>
  );
};

export default function CourseCard({ course, onEdit, onDelete, showActions = false }) {
  if (!course) return null;

  const teacher = course.teacher;
  const imageUrl = course.imageUrl 
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${course.imageUrl}`
    : placeholderImage;
  
  const teacherAvatarUrl = teacher?.avatarUrl
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${teacher.avatarUrl}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher?.name || 'T')}&background=random`;

  return (
    <CardWrapper course={course} showActions={showActions}>
      {/* Bagian Gambar */}
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={course.title} 
          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" 
          onError={(e) => { e.target.onerror = null; e.target.src=placeholderImage; }}
        />
        <div className="absolute top-3 right-3">
          <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
            <AvatarImage src={teacherAvatarUrl} alt={teacher?.name}/>
            <AvatarFallback>{teacher?.name?.split(' ').map(n=>n[0]).join('') || 'T'}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Bagian Konten */}
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          {course.category?.name}
        </p>
        <h3 className="text-base font-bold text-gray-900 leading-snug flex-grow line-clamp-2" title={course.title}>
          {course.title}
        </h3>
        <p className="text-xs text-gray-900 mt-1 mb-1">
          {course.curriculum?.replace('_', ' ')}
        </p>
        <p className="text-xs text-muted-foreground mt-1 mb-2">
          By {teacher?.name || 'N/A'}
        </p>
        <div className="my-1">
          <StarRating rating={course.averageRating} totalReviews={course.totalReviews} size={14} />
        </div>
        <div className="mt-auto pt-2">
          <p className="text-lg font-extrabold text-gray-900">
            {formatCurrencyIDR(course.price)}
            <span className="text-sm font-medium text-muted-foreground"> / sesi</span>
          </p>
        </div>
      </div>

      {/* Tombol Aksi (Hanya untuk Guru) */}
      {showActions && (
        <div className="p-4 pt-0 border-t mt-auto bg-gray-50 flex space-x-2">
          <Button
            size="sm"
            variant={'default'}
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(course); }}
          >
            <Edit className="h-4 w-4 mr-2"/> Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(course.id); }}
          >
             <Trash2 className="h-4 w-4 mr-2"/> Delete
          </Button>
        </div>
      )}
    </CardWrapper>
  );
}