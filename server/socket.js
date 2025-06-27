// src/socket.js
import { Server } from 'socket.io';
import prisma from './libs/prisma.js'; // Sesuaikan path prisma Anda

// Fungsi ini akan menerima server HTTP sebagai argumen
export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // --- Otorisasi Koneksi Socket (Middleware) ---
  // Ini adalah cara yang lebih bersih untuk menangani otentikasi
  io.use((socket, next) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.user = { id: userId }; // Simpan userId di objek socket
      return next();
    }
    // Jika tidak ada userId, tolak koneksi
    return next(new Error('Authentication error: User ID not provided.'));
  });


  // --- Logika Utama Saat User Terhubung ---
  io.on('connection', (socket) => {
    console.log(`✅ User Connected: ${socket.id} (User ID: ${socket.user.id})`);

    // Secara otomatis join ke ruangan pribadi berdasarkan ID user
    socket.join(socket.user.id);

    // --- Menangani Event-event Spesifik ---
    handleChatEvents(socket, io);
    // Di masa depan, Anda bisa menambahkan handler lain di sini
    // handleGameEvents(socket, io); 
    // handleCollaborationEvents(socket, io);

    socket.on('disconnect', () => {
      console.log(`❌ User Disconnected: ${socket.id}`);
    });
  });

  // Ekspor `io` agar bisa digunakan di service lain
  return io;
};


// --- Handler Khusus untuk Fitur Chat ---
const handleChatEvents = (socket, io) => {
  // Event saat user membuka jendela chat
  socket.on('joinChatRoom', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`User ${socket.user.id} joined chat room: ${conversationId}`);
    }
  });

  // Event saat user mengirim pesan
  socket.on('sendMessage', async (data) => {
    console.log('✅ [Socket] Received "sendMessage" event with data:', data);
    const { conversationId, content } = data;
    const senderId = socket.user.id; // Ambil senderId dari objek socket yang sudah terotentikasi

    if (!conversationId || !content) {
      return console.error('❌ [Socket] Invalid message payload from user:', senderId);
    }

    try {
      // Otorisasi & Logika Simpan + Broadcast
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          booking: {
            include: {
              student: { select: { id: true, role: true } },
              course: { select: { title: true, teacher: { select: { id: true, role: true } } } }
            }
          }
        }
      });

      const bookingInfo = conversation?.booking;

      if (!conversation || (senderId !== conversation.booking.student.id && senderId !== conversation.booking.course.teacher.id)) {
        return console.error(`❌ [Socket] Unauthorized message attempt.`);
      }
      
      const newMessage = await prisma.message.create({
        data: {
          content,
          conversationId,
          senderId,
        },
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } }
        }
      });
      console.log('✅ [Socket] Message saved to DB:', newMessage.id);

      io.to(conversationId).emit('receiveMessage', newMessage);
      console.log(`✅ [Socket] Message sent to room: ${conversationId}`);

      // ======================================================
      // AWAL LOGIKA NOTIFIKASI BARU
      // ======================================================
      // 3. Tentukan siapa penerima notifikasi
      const recipient = (senderId === bookingInfo.student.id) ? bookingInfo.course.teacher : bookingInfo.student;
      const recipientId = recipient.id;
      
      // 4. Buat konten dan link notifikasi
      const notificationContent = `Anda memiliki pesan baru dari ${newMessage.sender.name}.`;
      const notificationLink = `/${recipient.role.toLowerCase()}/chat/${conversationId}`;

      // 5. Simpan notifikasi ke DB untuk riwayat
      const newNotification = await prisma.notification.create({
        data: {
          recipientId: recipientId,
          content: notificationContent,
          link: notificationLink,
        }
      });

      // 6. Kirim event notifikasi HANYA ke penerima
      io.to(recipientId).emit('new_notification', {
        message: notificationContent,
        notification: newNotification
      });
      console.log(`✅ [Socket] Chat notification sent to user: ${recipientId}`);
      // ======================================================
      // AKHIR LOGIKA NOTIFIKASI BARU
      // ======================================================


    } catch (error) {
      console.error("❌ [Socket] Error in sendMessage handler:", error);
    }
  });
};