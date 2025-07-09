import prisma from '../../libs/prisma.js';
import AppError from '../utils/AppError.mjs';

/**
 * Service untuk mengambil semua percakapan milik user yang login.
 * @param {object} user - Objek user yang sedang login.
 * @returns {Promise<Array>}
 */
export async function getMyConversationsService(user) {
  try {
    const userId = user.id;
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

    const conversationPromises = participations.map(async (p) => {
      const conv = p.conversation;
      const otherParticipant = conv.participants.find(part => part.userId !== userId);
      
      const unreadCount = await prisma.message.count({
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
        unreadCount: unreadCount,
      };
    });

    return await Promise.all(conversationPromises);

  } catch (err) {
    throw new AppError(err.message, 500);
  }
}

/**
 * Service untuk mengambil pesan dari sebuah percakapan berdasarkan ID.
 * @param {string} conversationId - ID dari percakapan.
 * @param {object} user - User yang sedang login (untuk otorisasi).
 * @returns {Promise<Array>}
 */
export async function getMessagesByConversationIdService(conversationId, user) {
    const userId = user.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }
    
    // Otorisasi: Pastikan user adalah bagian dari percakapan ini
    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new AppError('You are not authorized to view this chat', 403);
    }

    // Ambil semua pesan
    return await prisma.message.findMany({
      where: { conversationId: conversationId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
}

/**
 * Service untuk menandai sebuah percakapan sebagai telah dibaca.
 * @param {string} conversationId - ID percakapan.
 * @param {object} user - User yang sedang login.
 */
export async function markConversationAsReadService(conversationId, user) {
  const userId = user.id;
  try {
    await prisma.participant.update({
      where: {
        userId_conversationId: { userId, conversationId }
      },
      data: {
        lastReadAt: new Date()
      }
    });
  } catch (err) {
     throw new AppError(err.message, 500);
  }
}