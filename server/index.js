import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import AppError from './src/utils/AppError.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.js';
import courseRoutes from './src/routes/courses.js';
import bookingRoutes from './src/routes/bookings.js';
import paymentRoutes from './src/routes/payments.js';
import bookingSessionRoutes from './src/routes/bookingSessions.js';
import userRoutes from './src/routes/users.js';
import teacherRoutes from './src/routes/teachers.js';
import payoutRoutes from './src/routes/payouts.js';
import paymentOptionsRoutes from './src/routes/paymentOptions.js';
import dashboardRoutes from './src/routes/dashboard.js';
import errorController from './src/services/errorService.js';
import appSettingRoutes from './src/routes/appSettings.js';
import availabilityRoutes from './src/routes/availability.js';
import financeRoutes from './src/routes/finance.js';
import notificationRoutes from './src/routes/notification.route.js';
import chatRoutes from './src/routes/chat.route.js';
import prisma from './libs/prisma.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // Izinkan koneksi dari origin frontend Anda
    origin: "http://localhost:5173", 
    // Izinkan metode yang diperlukan untuk handshake
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Ekspor `io` agar bisa dipakai di service lain
export { io };

io.on('connection', (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);
  const userId = socket.handshake.query.userId;

  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room.`);
  }

  // Event saat user membuka jendela chat
  socket.on('joinChatRoom', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`User ${userId} joined chat room: ${conversationId}`);
    }
  });

  // Event saat user mengirim pesan
  socket.on('sendMessage', async (data) => {
    console.log('✅ [Socket] Received "sendMessage" event with data:', data);
    const { conversationId, content, senderId } = data;

    if (!conversationId || !content || !senderId) {
      console.error('❌ [Socket] Invalid message payload:', data);
      return; // Hentikan jika data tidak lengkap
    }

    try {
      // Otorisasi: Pastikan pengirim adalah bagian dari booking ini
      // Ini adalah langkah keamanan penting
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { booking: { select: { studentId: true, course: { select: { teacherId: true } } } } }
      });
      
      if (!conversation || (senderId !== conversation.booking.studentId && senderId !== conversation.booking.course.teacherId)) {
        console.error(`❌ [Socket] Unauthorized attempt to send message to conversation ${conversationId} by user ${senderId}`);
        return;
      }
      
      // 1. Simpan pesan ke database
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

      // 2. Kirim pesan ke semua orang di ruangan chat yang sama
      io.to(conversationId).emit('receiveMessage', newMessage);
      console.log(`✅ [Socket] Message sent to room: ${conversationId}`);

    } catch (error) {
      console.error("❌ [Socket] Error while saving/sending message:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// === SETUP DIRECTORY HELPERS ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === GLOBAL MIDDLEWARE ===
app.use(helmet());

// CORS: allow frontend dev port (change for prod)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', ],
  credentials: true,
}));

// JSON body parser (for JSON APIs)
app.use(express.json());

// Logging
app.use(morgan('tiny'));

// === STATIC FILES ===
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// === RATE LIMIT (Production only) ===
if (process.env.NODE_ENV === 'production') {
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }));
  console.log('✅ Rate limiter active');
} else {
  console.log('development mode');
}

// === ROUTES ===
app.use('/api/auth',    authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookingsessions', bookingSessionRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api', payoutRoutes); 
app.use('/api', paymentOptionsRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/settings', appSettingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/notifications', notificationRoutes)
app.use('/api/conversations', chatRoutes)

// === ERROR HANDLER ===
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

// === START SERVER ===
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on Socket.IO http://localhost:${PORT}`)
);
