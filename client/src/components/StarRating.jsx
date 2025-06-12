// src/components/StarRating.jsx
import React from 'react';
import { Star } from 'lucide-react';


export default function StarRating({ rating = 0, totalReviews, size = 16 }) {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1 > 0;

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-orange-500 text-sm">{rating.toFixed(1)}</span>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
            const starValue = i + 1;
            const isFull = starValue <= fullStars;
            const isFilled = rating >= starValue - 0.25; 
            
            return (
                <Star 
                    key={i} 
                    size={size} 
                    className={`transition-colors ${isFilled ? 'text-orange-400 fill-orange-400' : 'text-gray-300 fill-gray-300'}`}
                />
            );
        })}
      </div>
      {totalReviews !== undefined && (
          <span className="text-xs text-gray-500">({totalReviews.toLocaleString('id-ID')})</span>
      )}
    </div>
  );
}