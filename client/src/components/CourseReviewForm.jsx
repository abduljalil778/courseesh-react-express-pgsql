import {useState} from 'react';
import Swal from 'sweetalert2';
import Spinner from './Spinner';


export default function CourseReviewForm(bookingId, courseId, teacherId, onSubmitReview, isSubmittingReview){
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            Swal.fire("Rating Required", "Please select a rating.", "warning");
            return;
        }
        onSubmitReview(bookingId, { rating, comment, courseId, teacherId });
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-md bg-gray-50 space-y-3">
            <h4 className="font-semibold text-md">Rate this Course</h4>
            <div>
                <label className="block text-sm font-medium text-gray-700">Rating (1-5 stars):</label>
                <div className="flex space-x-1 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            type="button" 
                            key={star} 
                            onClick={() => setRating(star)}
                            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor={`comment-${bookingId}`} className="block text-sm font-medium text-gray-700">Comment (Optional):</label>
                <textarea
                    id={`comment-${bookingId}`}
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                    placeholder="Share your experience..."
                />
            </div>
            <button 
                type="submit" 
                disabled={isSubmittingReview}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
                {isSubmittingReview ? <Spinner size={18} /> : 'Submit Review'}
            </button>
        </form>
    );
};