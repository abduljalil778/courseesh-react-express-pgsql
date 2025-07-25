// // client/src/pages/MyPayouts.jsx
// import React, { useEffect, useState, useCallback } from 'react';
// import { getMyPayoutsTeacher } from '../lib/api';
// import PayoutCardSkeleton from '@/components/skeleton/PayoutCardSkeleton';
// import { format, parseISO } from 'date-fns';
// import { formatCurrencyIDR } from '../utils/formatCurrency';
// import PayoutDetailModal from '../components/PayoutDetailModal';
// import { BanknotesIcon } from '@heroicons/react/24/outline';
// import { Button } from '@/components/ui/button';
// import { useNavigate } from 'react-router-dom';
// import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// export default function MyPayouts() {
//   const [payouts, setPayouts] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedPayout, setSelectedPayout] = useState(null);

//   const navigate = useNavigate()

//   const loadMyPayouts = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await getMyPayoutsTeacher();
//       setPayouts(response.data || []);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Could not load your payouts.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadMyPayouts();
//   }, [loadMyPayouts]);

//   const getPayoutStatusColor = (status) => {
//     switch (status) {
//       case 'PAID': return 'bg-green-100 text-green-800';
//       case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
//       case 'FAILED': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const placeholderImage = "/placeholder-course.jpg";

//   if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

//   return (
//     <>
//       <div>
//           <Breadcrumb>
//             <BreadcrumbList>
//               <BreadcrumbItem>
//                 <Button onClick={() => navigate('/teacher')} variant='ghost'>Home</Button>
//               </BreadcrumbItem>
//               <BreadcrumbSeparator/>
//               <BreadcrumbItem>
//                 <BreadcrumbPage>My Payouts</BreadcrumbPage>
//               </BreadcrumbItem>
//             </BreadcrumbList>
//           </Breadcrumb>
//       </div>
//       <div className="container mx-auto p-4 md:p-6 lg:p-8">
//         <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
//           Honor Saya
//         </h1>
        
//         <div className="space-y-4">
//           {isLoading ? (
//             // Jika sedang loading, tampilkan 3 buah skeleton
//             Array.from({ length: 3 }).map((_, index) => <PayoutCardSkeleton key={index} />)
//           ) : payouts.length === 0 ? (
//             <div className="p-6 text-center text-gray-500">You have no payouts yet.</div>
//           ) : (
//             // Jika sudah selesai, tampilkan data
//             payouts.map((payout) => {
//             const courseImageUrl = payout.booking?.course?.imageUrl
//               ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${payout.booking.course.imageUrl}`
//               : placeholderImage;
            
//             return (
//               <div key={payout.id} className="bg-white shadow-lg rounded-xl overflow-hidden">
//                 <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
//                   <div className="flex items-center gap-2">
//                     <BanknotesIcon className="h-4 w-4 text-gray-500" />
//                     <span className="font-medium text-gray-600">Payout</span>
//                     <span className="text-gray-400">|</span>
//                     <span className="text-gray-500">{format(parseISO(payout.createdAt), 'dd MMM yyyy')}</span>
//                   </div>
//                   <span className={`px-2 py-0.5 font-semibold rounded-full ${getPayoutStatusColor(payout.status)}`}>
//                     {payout.status.replace(/_/g, ' ')}
//                   </span>
//                 </div>

//                 <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
//                   <div className="md:col-span-2 flex items-center gap-4">
//                     <div className="w-20 h-20 bg-gray-200 rounded-md flex-shrink-0">
//                       <img src={courseImageUrl} alt={payout.booking?.course?.title} className="w-full h-full object-cover rounded-md" />
//                     </div>
//                     <div>
//                       <h3 className="text-base font-bold text-gray-800">{payout.booking?.course?.title || 'N/A'}</h3>
//                       {payout.bookingSession && (
//                         <p className="text-sm text-gray-500">Session on {format(parseISO(payout.bookingSession.sessionDate), 'dd MMM yyyy')}</p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="text-left md:text-right">
//                     <p className="text-sm text-gray-500">Total Payout</p>
//                     <p className="text-2xl font-bold text-green-600">{formatCurrencyIDR(payout.honorariumAmount)}</p>
//                   </div>
//                 </div>

//                 <div className="px-5 py-3 flex items-center justify-end gap-3">
//                   <Button variant="outline" size="sm" onClick={() => setSelectedPayout(payout)}>
//                     View Payout Details
//                   </Button>
//                   {payout.adminProofOfPaymentUrl && (
//                     <Button asChild size="sm">
//                       <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${payout.adminProofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer">
//                         View Proof
//                       </a>
//                     </Button>
//                   )}
//                 </div>
//               </div>
//               );
//             })
//           )}
//         </div>
//       </div>

//       {selectedPayout && (
//         <PayoutDetailModal
//           payout={selectedPayout}
//           onClose={() => setSelectedPayout(null)}
//         />
//       )}
//     </>
//   );
// }

import React, { useEffect, useState, useCallback } from 'react';
import { getMyPayoutsTeacher } from '../lib/api';
import Spinner from '../components/Spinner';
import PayoutCardSkeleton from '@/components/skeleton/PayoutCardSkeleton';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import PayoutDetailModal from '../components/PayoutDetailModal';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function MyPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const navigate = useNavigate();

  const loadMyPayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMyPayoutsTeacher();
      setPayouts(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your payouts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyPayouts();
  }, [loadMyPayouts]);

  const getPayoutStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size={60} /></div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  // if (payouts.length === 0) return <div className="p-6 text-center text-gray-500">You have no payouts yet.</div>;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Button onClick={() => navigate('/teacher')} variant='ghost'>Home</Button>
          </BreadcrumbItem>
          <BreadcrumbSeparator/>
          <BreadcrumbItem>
            <BreadcrumbPage>Honor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
          Riwayat Honor
        </h1> */}
        
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <PayoutCardSkeleton key={index} />)
          ): payouts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">You have no payouts yet.</div>
          ) : (
          payouts.map((payout) => (
            <div key={payout.id} className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BanknotesIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-600">
                    Payout Periode {format(parseISO(payout.periodStartDate), 'dd MMM yyyy')} - {format(parseISO(payout.periodEndDate), 'dd MMM yyyy')}
                  </span>
                </div>
                <span className={`px-2 py-0.5 font-semibold rounded-full ${getPayoutStatusColor(payout.status)}`}>
                  {payout.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Total Sesi Selesai</p>
                  <p className="text-lg font-bold text-gray-800">{payout.totalSessions} Sesi</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-500">Total Payout</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrencyIDR(payout.honorariumAmount)}</p>
                </div>
              </div>

              <div className="px-5 py-3 flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedPayout(payout)}>
                  Lihat Rincian
                </Button>
                {payout.adminProofOfPaymentUrl && (
                  <Button asChild size="sm">
                    <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${payout.adminProofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer">
                      Lihat Bukti Transfer
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {selectedPayout && (
        <PayoutDetailModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
        />
      )}
    </>
  );
}