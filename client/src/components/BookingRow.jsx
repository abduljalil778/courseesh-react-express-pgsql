// src/components/BookingRow.jsx
import React from 'react';
import dayjs from 'dayjs';

export default function BookingRow({ booking, onCancel }) {
  return (
    <tr>
      <td className="px-4 py-2">{booking.course.title}</td>
      <td className="px-4 py-2">
        {dayjs(booking.bookingDate).format('YYYY-MM-DD HH:mm')}
      </td>
      <td className="px-4 py-2">{booking.status}</td>
      <td className="px-4 py-2">
        {booking.status === 'PENDING' && (
          <button
            onClick={() => onCancel(booking.id)}
            className="text-red-600 underline"
          >
            Cancel
          </button>
        )}
      </td>
    </tr>
  );
}
