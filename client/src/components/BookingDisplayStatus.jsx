export default function BookingDisplayStatus(booking) {
    const hasPaidPayment = booking.payments.some(p => p.status === 'PAID');
    if (booking.bookingStatus === 'PENDING') {
      if (!hasPaidPayment) {
        return {variant: 'destructive', text: 'Waiting for Payment', colorClass: 'text-orange-700 bg-orange-100' };
      }
      return { text: 'Waiting Teacher Confirmation', colorClass: 'text-yellow-700 bg-yellow-100' };
    } else if (booking.bookingStatus === 'CONFIRMED' && (!hasPaidPayment)) {
    return { variant: 'destructive', text: 'Waiting for Payment', colorClass: 'text-orange-700 bg-orange-100'}
  }
    switch (booking.bookingStatus) {
      case 'CONFIRMED': return { text: 'On Going', colorClass: 'text-green-700 bg-green-100' };
      case 'COMPLETED': return { text: 'Completed', colorClass: 'text-blue-700 bg-blue-100' };
      case 'CANCELLED': return { text: 'Cancelled', colorClass: 'text-red-700 bg-red-100' };
      default: return { text: booking.bookingStatus, colorClass: 'text-gray-700 bg-gray-100' };
    }
  };