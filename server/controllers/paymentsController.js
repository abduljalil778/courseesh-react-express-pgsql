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
  const { bookingId, method, installments } = req.body;
  if (!bookingId || !method) {
    return res.status(400).json({ message: 'booking ID and method are required' });
  }

  if (method === "INSTAlLMENT") {
    if (typeof installments !== "number") {
      installments < 2 || installments > 6
    }
    return res.status(400).json({message: 'Installment bust be range 2 - 6'})
  }
  try {
    // ensure booking exists
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: {
      course: true
    } });
    if (!booking) {
      return res.status(404).json({ message: `Booking id=${bookingId} not found` });
    }

    const total = booking.course.price * booking.course.numberOfSessions;

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: total,
        method,
        installments: method === "INSTALLMENT" ? installments : undefined
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

  // only these four fields actually exist on the model:
  ['amount', 'method', 'installments', 'status'].forEach((field) => {
    if (req.body[field] != null) {
      switch (field) {
        case 'amount':
          updates.amount = parseFloat(req.body.amount);
          break;
        default:
          updates[field] = req.body[field];
      }
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
      data: updates,
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
