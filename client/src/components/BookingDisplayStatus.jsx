export const getBookingDisplayStatus = (booking) => {
    const hasPaidPayment = booking.payments.some(p => p.status === 'PAID');
    if (booking.bookingStatus === 'PENDING' && !hasPaidPayment) {
      return { text: 'Waiting for Payment', colorClass: 'text-yellow-700 bg-yellow-100' };
    }
    switch (booking.bookingStatus) {
      case 'CONFIRMED': return { text: 'On Going', colorClass: 'text-green-700 bg-green-100' };
      case 'PENDING': return { text: 'Waiting Teacher Confirmation', colorClass: 'text-yellow-700 bg-yellow-100' };
      case 'COMPLETED': return { text: 'COMPLETED', colorClass: 'text-blue-700 bg-blue-100' };
      case 'CANCELLED': return { text: 'CANCELLED', colorClass: 'text-red-700 bg-red-100' };
      default: return { text: booking.bookingStatus, colorClass: 'text-gray-700 bg-gray-100' };
    }
  };