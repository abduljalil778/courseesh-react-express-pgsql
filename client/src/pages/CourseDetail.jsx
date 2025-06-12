// src/pages/CourseDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, getCourseReviews } from '../lib/api';
import Spinner from '../components/Spinner';
import { formatCurrencyIDR } from '../utils/formatCurrency';
// import { format, parseISO } from 'date-fns';
import StarRating from '../components/StarRating';
import { Button } from '@/components/ui/button';

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
    setError(null);
    setReviews([]); // <-- PERBAIKAN PENTING: Kosongkan review lama di awal fetch

    try {
      // Ambil detail kursus dan review secara bersamaan untuk efisiensi
      const [courseResponse, reviewsResponse] = await Promise.all([
        getCourseById(courseId),
        getCourseReviews(courseId)
      ]);
      
      // Data kursus dari getCourseById sudah termasuk averageRating dan totalReviews
      setCourse(courseResponse.data);
      setReviews(reviewsResponse.data || []);
      
    } catch (err) {
      console.error("Failed to load course data:", err);
      setError(err.response?.data?.message || 'Failed to load course data.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Spinner size={60} /></div>;
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

  // Ambil data rating dari objek kursus utama untuk konsistensi
  const averageRating = course.averageRating || 0;
  const totalReviews = course.totalReviews || 0;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{course.title}</h1>
        <p className="text-md text-gray-500 mb-4">{course.description}</p>
        
        <div className="flex items-center space-x-4 mb-6">
            <StarRating rating={averageRating} totalReviews={totalReviews} />
            <span className="text-gray-400">|</span>
            <div className="text-sm">
                <span className="text-gray-600">Created by </span> 
                <span className="font-semibold text-indigo-600">{course.teacher?.name}</span>
            </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8 p-4 bg-gray-50 rounded-lg">
            <div>
                <p className="text-xs text-gray-500 uppercase">Price</p>
                <p className="font-bold text-lg text-indigo-600">{formatCurrencyIDR(course.price)}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 uppercase">Sessions</p>
                <p className="font-bold text-lg">{course.numberOfSessions}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 uppercase">Class Level</p>
                <p className="font-bold text-lg">{course.classLevels?.join(', ')}</p>
            </div>
             <div>
                <p className="text-xs text-gray-500 uppercase">Curriculum</p>
                <p className="font-bold text-lg">{course.curriculum || 'All'}</p>
            </div>
        </div>

        <div className="text-center mb-10">
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg" onClick={() => navigate(`/student/book/${courseId}`)}>
            Book This Course Now
          </Button>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Student Reviews ({totalReviews})</h2>
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="p-4 border-b">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                       {review.student?.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-900">{review.student?.name || 'Anonymous'}</p>
                        <div className="flex items-center mt-1">
                            <StarRating rating={review.rating} size={14} />
                        </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-3 italic">"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center italic py-4">No reviews yet for this course. Be the first to leave a review!</p>
          )}
        </div>
      </div>
    </div>
  );
}