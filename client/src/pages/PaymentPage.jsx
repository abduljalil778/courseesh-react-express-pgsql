// src/pages/PaymentPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBookingById, getActivePaymentOptions } from '../lib/api';
import Spinner from '../components/Spinner';
import { formatCurrencyIDR } from '../utils/formatCurrency';

export default function PaymentPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!bookingId) {
      setError("Booking ID is missing from the URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Ambil data booking dan opsi pembayaran secara bersamaan untuk efisiensi
      const [bookingResponse, optionsResponse] = await Promise.all([
        getBookingById(bookingId),
        getActivePaymentOptions()
      ]);
      setBooking(bookingResponse.data);
      setPaymentOptions(optionsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment details.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Kalkulasi jumlah yang harus dibayar
  const amountToPay = useMemo(() => {
    if (!booking) return 0;
    // Jika pembayaran cicilan, ambil jumlah cicilan pertama
    if (booking.paymentMethod === 'INSTALLMENT') {
      const firstInstallment = booking.payments?.find(p => p.installmentNumber === 1);
      return firstInstallment?.amount || 0;
    }
    // Jika pembayaran penuh, ambil harga total kursus
    return (booking.course?.price || 0) * (booking.sessions?.length || 0);
  }, [booking]);
//   console.log('Booking data received on Payment Page:', JSON.stringify(booking, null, 2));
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size={60} />
      </div>
    );
  }
  
  if (error) {
    return <div className="p-6 text-center text-red-500 font-semibold">{error}</div>;
  }
  
  if (!booking) {
    return <div className="p-6 text-center text-gray-500">Booking details not found.</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-gray-800">Booking Successful!</h1>
          <p className="mt-2 text-gray-600">Please complete your payment to activate the course sessions.</p>
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-700">Payment Details</h2>
          <div className="mt-4 space-y-2 text-sm bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-mono text-gray-800">{booking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Course:</span>
              <span className="font-semibold text-gray-800 text-right">{booking.course?.title}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span className="text-gray-800">Amount to Pay:</span>
              <span className="text-indigo-600">{formatCurrencyIDR(amountToPay)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700">Payment Instructions</h2>
          <div className="mt-4 text-sm text-gray-700 bg-blue-50 p-4 rounded-md border border-blue-200">
            <p className="font-semibold">Please make a bank transfer to one of the following accounts:</p>
            
            <div className="mt-4 space-y-4">
              {paymentOptions.length > 0 ? (
                paymentOptions.map(option => (
                  <div key={option.id} className="p-4 border bg-white rounded-md flex items-center">
                    {option.logoUrl && <img src={option.logoUrl} alt={`${option.bankName} logo`} className="h-8 w-12 object-contain mr-4"/>}
                    <div>
                      <p className="font-bold text-base">{option.bankName}</p>
                      <p className="text-gray-800">Account Number: <strong className="font-mono">{option.accountNumber}</strong></p>
                      <p className="text-gray-800">Account Holder: <strong>{option.accountHolder}</strong></p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="italic text-center p-4">No payment options are available at the moment. Please contact our support.</p>
              )}
            </div>

            <p className="mt-6 font-semibold text-red-600">
              Important: Please include your Booking ID in the transfer description/notes for faster verification.
            </p>
            <p className="mt-4">
              After payment, our admin will verify your transaction within 1x24 hours on business days. You can check your booking status on the "My Bookings" page.
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
            <Link to="/student/my-bookings" className="text-indigo-600 hover:underline font-medium">
                Check My Booking Status &rarr;
            </Link>
        </div>
      </div>
    </div>
  );
}