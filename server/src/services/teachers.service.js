// import AppError from '../utils/AppError.mjs';
// import payoutRepository from '../repositories/payoutRepository.js';

// /**
//  * Service untuk guru mengambil semua data payout miliknya.
//  * @param {string} teacherId - ID dari guru yang sedang login.
//  * @returns {Promise<Array>}
//  */
// export async function getMyPayoutsService(teacherId) {
//   try {
//     return await payoutRepository.findMany({
//       where: { teacherId: teacherId },
//       include: {
//         booking: {
//           select: {
//             id: true,
//             course: { select: { title: true, imageUrl: true } },
//             student: { select: { name: true } },
//             courseCompletionDate: true,
//             createdAt: true,
//             sessions: {
//               select: { id: true, sessionDate: true, status: true },
//               orderBy: { sessionDate: 'asc' },
//             }
//           },
//         },
//         bookingSession: {
//           select: { id: true, sessionDate: true }
//         }
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   } catch (err) {
//     throw new AppError(err.message || 'Failed to fetch payouts', 500);
//   }
// };