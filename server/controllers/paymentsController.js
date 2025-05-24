// // server/controllers/paymentsController.js
// // import { PrismaClient } from '@prisma/client';
// import pkg from '@prisma/client';
// const { PrismaClient } = pkg;
// const prisma = new PrismaClient();

// /**
//  * GET /api/payments
//  */
// export const getAllPayments = async (req, res) => {
//   const payments = await prisma.payment.findMany({
//     include: { booking: { include: { course: true, student: true } } }
//   });
//   res.json(payments);
// };

// /**
//  * GET /api/payments/:id
//  */
// export const getPaymentById = async (req, res) => {
//   const payment = await prisma.payment.findUnique({
//     where: { id: req.params.id },
//     include: { booking: { include: { course: true, student: true } } }
//   });
//   if (!payment) return res.status(404).json({ message: 'Payment not found' });
//   res.json(payment);
// };

// /**
//  * POST /api/payments
//  * Body: { bookingId, amount, paymentDate, paymentStatus }
//  */
// export const createPayment = async (req, res) => {
//   const { bookingId, amount, paymentDate, paymentStatus } = req.body;
//   try {
//     const payment = await prisma.payment.create({
//       data: {
//         bookingId,
//         amount: parseFloat(amount),
//         paymentDate: new Date(paymentDate),
//         paymentStatus
//       }
//     });
//     res.status(201).json(payment);
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ message: 'Error creating payment' });
//   }
// };

// /**
//  * PUT /api/payments/:id
//  * Body: { amount, paymentDate, paymentStatus }
//  */
// export const updatePayment = async (req, res) => {
//   const { amount, paymentDate, paymentStatus } = req.body;
//   try {
//     const payment = await prisma.payment.update({
//       where: { id: req.params.id },
//       data: {
//         amount: parseFloat(amount),
//         paymentDate: new Date(paymentDate),
//         paymentStatus
//       }
//     });
//     res.json(payment);
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ message: 'Error updating payment' });
//   }
// };

// /**
//  * DELETE /api/payments/:id
//  */
// export const deletePayment = async (req, res) => {
//   try {
//     await prisma.payment.delete({ where: { id: req.params.id } });
//     res.status(204).send();
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ message: 'Error deleting payment' });
//   }
// };

// server/controllers/paymentsController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

/**
 * GET /api/payments
 * ADMIN only
 */
export const getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            course:  { select: { id: true, title: true } }
          }
        }
      }
    });
    return res.json(payments);
  } catch (err) {
    console.error('getAllPayments:', err);
    return res.status(500).json({ message: 'Server error fetching payments' });
  }
};

/**
 * GET /api/payments/:id
 * ADMIN only
 */
export const getPaymentById = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            course:  { select: { id: true, title: true } }
          }
        }
      }
    });
    if (!payment) {
      return res.status(404).json({ message: `Payment id=${id} not found` });
    }
    return res.json(payment);
  } catch (err) {
    console.error('getPaymentById:', err);
    return res.status(500).json({ message: 'Server error fetching payment' });
  }
};

/**
 * POST /api/payments
 * ADMIN only
 * Body: { bookingId, amount, paymentDate, paymentStatus }
 */
export const createPayment = async (req, res) => {
  const { bookingId, amount, paymentDate, paymentStatus } = req.body;
  if (!bookingId || amount == null || !paymentDate || !paymentStatus) {
    return res.status(400).json({ message: 'bookingId, amount, paymentDate, paymentStatus are required' });
  }
  try {
    // ensure booking exists
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ message: `Booking id=${bookingId} not found` });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        paymentStatus
      }
    });
    return res.status(201).json(payment);
  } catch (err) {
    console.error('createPayment:', err);
    return res.status(500).json({ message: 'Server error creating payment' });
  }
};

/**
 * PUT /api/payments/:id
 * ADMIN only
 * Body: { amount?, paymentDate?, paymentStatus? }
 */
export const updatePayment = async (req, res) => {
  const { id } = req.params;
  const updates = {};
  ['amount', 'paymentDate', 'paymentStatus'].forEach(field => {
    if (req.body[field] != null) {
      updates[field] = field === 'amount'
        ? parseFloat(req.body[field])
        : field === 'paymentDate'
          ? new Date(req.body[field])
          : req.body[field];
    }
  });
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: `Payment id=${id} not found` });
    }
    const updated = await prisma.payment.update({
      where: { id },
      data: updates
    });
    return res.json(updated);
  } catch (err) {
    console.error('updatePayment:', err);
    return res.status(500).json({ message: 'Server error updating payment' });
  }
};

/**
 * DELETE /api/payments/:id
 * ADMIN only
 */
export const deletePayment = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: `Payment id=${id} not found` });
    }
    await prisma.payment.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('deletePayment:', err);
    return res.status(500).json({ message: 'Server error deleting payment' });
  }
};
