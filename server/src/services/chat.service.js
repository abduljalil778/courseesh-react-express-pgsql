import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';


// export const getMyConversations = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     // Cari semua booking yang berstatus aktif/selesai dimana user ini adalah siswa ATAU guru
//     const userBookings = await prisma.booking.findMany({ 
//       where: {
//         bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] },
//         OR: [
//           { studentId: userId },
//           { course: { teacherId: userId } }
//         ],
//         // Pastikan hanya booking yang sudah punya conversation
//         NOT: { conversationId: null }
//       },
//       select: {
//         conversationId: true,
//         // Ambil data user LAIN dalam percakapan ini
//         student: { select: { id: true, name: true, avatarUrl: true } },
//         course: { select: { teacher: { select: { id: true, name: true, avatarUrl: true } } } }
//       }
//     });

//     // Format data agar mudah digunakan di frontend
//     const conversations = userBookings.map(b => {
//       // Tentukan siapa "lawan bicara"
//       const otherUser = req.user.role === 'STUDENT' 
//         ? b.course.teacher 
//         : b.student;
      
//       return {
//         conversationId: b.conversationId,
//         otherUser: otherUser
//       };
//     });

//     res.json({ data: conversations });
//   } catch (err) {
//     next(new AppError(err.message, 500));
//   }
// };

export const getMyConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const participations = await prisma.participant.findMany({
      where: { userId },
      orderBy: { conversation: { updatedAt: 'desc' } },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      }
    });

    const conversations = participations.map(p => {
      const conv = p.conversation;
      const otherParticipant = conv.participants.find(part => part.userId !== userId);
      
      // Hitung pesan yang belum dibaca
      const unreadCount = prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          createdAt: { gt: p.lastReadAt || new Date(0) }
        }
      });

      return {
        conversationId: conv.id,
        lastMessage: conv.messages[0] || null,
        otherUser: otherParticipant?.user,
        unreadCount: unreadCount, // Kirim promise-nya, kita resolve di frontend
      };
    });

    // Resolve semua promise unreadCount
    const finalConversations = await Promise.all(
      conversations.map(async c => ({ ...c, unreadCount: await c.unreadCount }))
    );

    res.json({ data: finalConversations });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

export const markConversationAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await prisma.participant.update({
      where: {
        userId_conversationId: { userId, conversationId }
      },
      data: {
        lastReadAt: new Date()
      }
    });
    res.status(204).send();
  } catch (err) {
     next(new AppError(err.message, 500));
  }
};


export const getMessagesByConversationId = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // 1. Validasi: pastikan user adalah bagian dari percakapan ini
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { booking: { select: { studentId: true, course: { select: { teacherId: true } } } } }
    });

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    const bookingInfo = conversation.booking;
    if (userId !== bookingInfo.studentId && userId !== bookingInfo.course.teacherId) {
      return next(new AppError('You are not authorized to view this chat', 403));
    }

    // 2. Jika otorisasi berhasil, ambil semua pesan
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ data: messages });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};