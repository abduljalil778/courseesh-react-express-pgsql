export * from '../services/availabilityService.js'
import { getUnavailableDatesByTeacherId } from '../services/availabilityService.js';

export const getTeacherUnavailableDatesController = async (req, res, next) => {
  try {
    const { teacherId } = req.params; // Atau dari req.query, tergantung bagaimana Anda mengirim ID guru
    if (!teacherId) {
      return next(new AppError('Teacher ID is required', 400));
    }
    const dates = await getUnavailableDatesByTeacherId(teacherId);
    res.json(dates);
  } catch (err) {
    next(err);
  }
};