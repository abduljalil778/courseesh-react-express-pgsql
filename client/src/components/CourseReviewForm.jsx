// src/components/CourseReviewForm.jsx
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import Spinner from './Spinner';

const InteractiveStarRating = ({ rating, setRating }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button 
          type="button" 
          key={star} 
          onClick={() => setRating(star)}
          className={`text-3xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};


export default function CourseReviewForm({ booking, onSubmit, isSubmitting }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            Swal.fire("Rating Required", "Please select a star rating.", "warning");
            return;
        }
        if (typeof onSubmit === 'function') {
            onSubmit(booking.id, { rating, comment });
        } else {
            console.error("onSubmit prop is not a function!", onSubmit);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Leave a Review</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Your Rating *</label>
                <InteractiveStarRating rating={rating} setRating={setRating} />
            </div>
            <div className="mt-4">
                <label htmlFor={`comment-${booking.id}`} className="block text-sm font-medium text-gray-700">Your Comment (Optional)</label>
                <textarea
                    id={`comment-${booking.id}`}
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                    placeholder="Share your experience with this course and teacher..."
                />
            </div>
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-4 px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center"
            >
                {isSubmitting ? <><Spinner size={18} className="mr-2"/> Submitting...</> : 'Submit Review'}
            </button>
        </form>
    );
}