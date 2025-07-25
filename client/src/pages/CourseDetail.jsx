import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseById, getCourseReviews } from '../lib/api';
import CourseDetailSkeleton from '@/components/skeleton/CourseDetailSkeleton';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import { format, parseISO } from 'date-fns';
import StarRating from '../components/StarRating';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, BookOpen, Users, BarChart2, Award, BadgeCheckIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const StickyBookingCard = ({ course, onBookNow }) => (
  <div className="lg:sticky lg:top-24">
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <img 
        src={course.imageUrl ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${course.imageUrl}` : "/placeholder-course.jpg"} 
        alt={course.title} 
        className="w-full h-48 object-cover" 
      />
      <div className="p-6">
        <p className="text-3xl font-extrabold text-gray-900 mb-4">
          {formatCurrencyIDR(course.price)}
          <span className="text-base font-medium text-muted-foreground"> / sesi</span>
        </p>
        <Button size="lg" className="w-full hover:bg-indigo-700 text-lg h-12" onClick={onBookNow}>
          Pesan Kursus
        </Button>
        <ul className="mt-6 space-y-3 text-sm">
          <li className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-indigo-500" /><span>Kurikulum: <span className="font-semibold">{course.curriculum.replace('_', ' ') || 'General'}</span></span></li>
          <li className="flex items-center gap-3"><Users className="h-5 w-5 text-indigo-500" /><span>Level Kelas: <span className="font-semibold">{course.classLevels?.join(', ')}</span></span></li>
          <li className="flex items-center gap-3"><Award className="h-5 w-5 text-indigo-500" /><span>Kategori: <span className="font-semibold">{course.category.name}</span></span></li>
        </ul>
      </div>
    </div>
  </div>
);

const AboutInstructor = ({ teacher }) => (
  <div className="mt-12">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Tentang Instruktur</h2>
    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
      <Avatar className="h-16 w-16">
        <AvatarImage src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${teacher.avatarUrl}`} alt={teacher.name} />
        <AvatarFallback>{teacher.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
      </Avatar>
      <div>
        <Link to={`/teachers/${teacher.id}`} className="hover:underline" target='_blank'>
          <h3 className="font-bold text-lg text-gray-900">{teacher.name}</h3>
        </Link>
        <Badge
          variant="secondary"
          className="bg-blue-500 text-white dark:bg-blue-600"
        >
          <BadgeCheckIcon />
          Verified Instructor
        </Badge>
      </div>
    </div>
  </div>
);

const ReviewsSection = ({ reviews, totalReviews }) => (
  <div className="mt-12">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">Ulasan Siswa ({totalReviews})</h2>
    {reviews.length > 0 ? (
      <div className="space-y-6">
        {reviews.slice(0, 5).map(review => (
          <div key={review.id} className="border-b pb-4">
            <div className="flex items-center mb-2">
              <Avatar className="h-10 w-10 mr-3">
                 <AvatarImage src={review.student.avatarUrl ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${review.student.avatarUrl}` : ''} alt={review.student.name} />
                 <AvatarFallback>{review.student?.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-gray-900">{review.student?.name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">{format(parseISO(review.createdAt), 'dd MMMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center my-2">
              <StarRating rating={review.rating} size={16} />
            </div>
            {review.comment && <p className="text-gray-700 text-sm italic">"{review.comment}"</p>}
          </div>
        ))}
        {/* bisa menambahkan tombol "Lihat semua review" di sini jika perlu */}
      </div>
    ) : (
      <p className="text-gray-500 text-center py-4">Belum ada ulasan untuk kursus ini.</p>
    )}
  </div>
);

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!courseId) {
      setError('No course ID specified.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [courseResponse, reviewsResponse] = await Promise.all([
        getCourseById(courseId),
        getCourseReviews(courseId)
      ]);
      setCourse(courseResponse.data.data);
      setReviews(reviewsResponse.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course data.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <CourseDetailSkeleton/>
  }
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }
  
  if (!course) {
    return <div className="p-6 text-center text-xl text-gray-600">Course not found.</div>;
  }


  return (
    <>
    <div>
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Button onClick={() => navigate('/student')} variant='ghost'>
            Home
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
        <BreadcrumbItem>
          <BreadcrumbPage>
            Detail Kursus
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    </div>
    <div className="bg-gray-100">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 lg:gap-x-12">
          
          <main className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">{course.title}</h1>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-6">
              <StarRating rating={course.averageRating} totalReviews={course.totalReviews} />
              <div className="text-sm">
                <span className="text-gray-600">Oleh </span> 
                <span className="font-semibold text-indigo-600">{course.teacher?.name}</span>
              </div>
            </div>
            
            {/* --- MENAMPILKAN DESKRIPSI --- */}
            <div className="prose max-w-none mb-8">
              <p>{course.description}</p>
            </div>
            
            {/* --- MENAMPILKAN "WHAT YOU'LL LEARN" --- */}
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <div className="p-6 border bg-white border-gray-200 rounded-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Apa yang akan Anda Pelajari</h2>
                <ul className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                  {course.learningObjectives.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <AboutInstructor teacher={course.teacher} />
            <ReviewsSection reviews={reviews} totalReviews={course.totalReviews} />
          </main>

          <aside className="mt-10 lg:mt-0">
            <StickyBookingCard course={course} onBookNow={() => navigate(`/student/cart/checkout/${courseId}`)} />
          </aside>

        </div>
      </div>
    </div>
    </>
  );
}