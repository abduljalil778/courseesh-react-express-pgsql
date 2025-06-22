import prisma from '../../libs/prisma.js';

export const getMessagesByBookingId = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // 1. Validasi: pastikan user adalah bagian dari booking ini
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { studentId: true, course: { select: { teacherId: true } }, conversationId: true },
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (userId !== booking.studentId && userId !== booking.course.teacherId) {
      return next(new AppError('You are not authorized to view this chat', 403));
    }

    if (!booking.conversationId) {
      return res.json({ data: [] }); // Belum ada percakapan, kembalikan array kosong
    }

    // 2. Ambil semua pesan
    const messages = await prisma.message.findMany({
      where: { conversationId: booking.conversationId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } } // Sertakan info pengirim
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ data: messages });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

export const getMyConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Cari semua booking yang berstatus aktif/selesai dimana user ini adalah siswa ATAU guru
    const userBookings = await prisma.booking.findMany({
      where: {
        bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] },
        OR: [
          { studentId: userId },
          { course: { teacherId: userId } }
        ],
        // Pastikan hanya booking yang sudah punya conversation
        NOT: { conversationId: null }
      },
      select: {
        conversationId: true,
        // Ambil data user LAIN dalam percakapan ini
        student: { select: { id: true, name: true, avatarUrl: true } },
        course: { select: { teacher: { select: { id: true, name: true, avatarUrl: true } } } }
      }
    });

    // Format data agar mudah digunakan di frontend
    const conversations = userBookings.map(b => {
      // Tentukan siapa "lawan bicara"
      const otherUser = req.user.role === 'STUDENT' 
        ? b.course.teacher 
        : b.student;
      
      return {
        conversationId: b.conversationId,
        otherUser: otherUser
      };
    });

    res.json({ data: conversations });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};