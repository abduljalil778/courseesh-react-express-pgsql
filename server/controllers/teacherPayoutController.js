// server/controllers/teacherPayoutController.js
import {PrismaClient, Prisma, PayoutStatus } from '@prisma/client'
import AppError from '../utils/AppError.mjs';
const prisma = new PrismaClient()

// GET /api/payouts
export const getAllTeacherPayouts = async (req, res, next) => {
  try {
    const { status, teacherId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (teacherId) where.teacherId = teacherId;

    const payouts = await prisma.teacherPayout.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            bankName: true,
            bankAccountHolder: true,
            bankAccountNumber: true,
          },
        },
        booking: {
          select: {
            id: true,
            course: { select: { title: true, imageUrl: true,} },
            student: { select: { name: true } },
          },
        },
        bookingSession: {
          select: {
            id: true,
            sessionDate: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payouts);
  } catch (err) {
    next(new AppError(err.message || 'Failed to get all payouts', 500));
  }
};

// GET /api/payout/:payoutId
export const getTeacherPayoutById = async (req, res, next) => {
    const {id: payoutId} = req.params;
    try {
        const payout = await prisma.teacherPayout.findUnique({
            where: {id: payoutId},
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  bankName: true,
                  bankAccountHolder: true,
                  bankAccountNumber: true,
                  avatarUrl: true,
                },
              },
              booking: {
                select: {
                  id: true,
                  course: { select: { title: true } },
                  student: { select: { name: true } },
                },
              },
              bookingSession: {
                select: {
                  id: true,
                  sessionDate: true,
                }
              }
            },
        });
        if (!payout) { // Pengecekan setelah query
            return next(new AppError(`Payout with ID ${payoutId} not found`, 404));
        }
res.json(payout);
    } catch (err) {
        return next(new AppError(`payment with ${payoutId} not found: ${err.message}`, 404))
    }
}

// PUT /api/payouts/:payoutId
export const updateTeacherPayout = async (req, res, next) => {
  const { payoutId } = req.params;
  const { status, payoutTransactionRef, payoutDate, adminNotes } = req.body;

  try {
    if (status && !Object.values(PayoutStatus).includes(status)) {
      return next(new AppError(`Invalid payout status: ${status}`, 400));
    }

    const dataToUpdate = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (payoutTransactionRef !== undefined) dataToUpdate.payoutTransactionRef = payoutTransactionRef;
    if (payoutDate !== undefined) dataToUpdate.payoutDate = payoutDate ? new Date(payoutDate) : null;
    if (adminNotes !== undefined) dataToUpdate.adminNotes = adminNotes;
    if (req.file) {
      dataToUpdate.adminProofOfPaymentUrl = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return next(new AppError('No data provided for payout update.', 400));
    }

    const updatedPayout = await prisma.teacherPayout.update({
      where: { id: payoutId },
      data: dataToUpdate,
      include: {
         teacher: { select: { id: true, name: true, email: true } },
         booking: { 
            select: { 
                id: true, 
                course: { select: { title: true } },
                student: { select: { name: true } }
            } 
        },
        bookingSession: {
          select: {
            id: true,
            sessionDate: true,
          }
        }
      }
    });
    res.json(updatedPayout);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(new AppError(`TeacherPayout with ID ${payoutId} not found`, 404));
    }
    console.error(`Error updating payout ID ${payoutId}:`, err);
    next(new AppError(err.message || 'Failed to update payout', 500));
  }
};