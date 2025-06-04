import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Attach token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAllCourses = async () => {
  return await api.get('/courses');
}

export const getCourseById = async (courseId) => {
  return await api.get(`/courses/${courseId}`);
}

export const deleteCourse = async (id) => {
  return await api.delete(`/courses/${id}`);
}

export const createCourse = async (data) => {
  return await api.post(`/courses/`, data);
}

export const updateCourse = async (courseId, courseData) => {
  return await api.put(`/courses/${courseId}`, courseData);
}

export const createBooking = async (bookingData) => {
  return await api.post(`/bookings`, bookingData);
}

export const updateBookingStatus = async (id, newStatus) => {
  return await api.put(`/bookings/${id}`, {status: newStatus})
}

export const updateBooking = async (bookingId, bookingData) => {
  return await api.put(`/bookings/${bookingId}`, bookingData)
}

export const getAllBookings = async () => {
  return await api.get('/bookings')
}

export const getAllUsers = async () => {
  return await api.get('/users');
}

export const createUser = async (userData) => {
  return await api.post(`/users`, userData);
}

export const updateUser = async (userId, userData) => {
  return await api.put(`/users/${userId}`, userData);
}

export const deleteUser = async (userId) => {
  return await api.delete(`/users/${userId}`);
}

export const getAllPayments = async () => {
  return await api.get('/payments');
}

export const updatePayment = async (paymentId, paymentData) => {
  return await api.put(`/payments/${paymentId}`, paymentData);
}

export const submitOrUpdateSessionReport = async (sessionId, reportData) => {
  return await api.put(`/bookingsessions/${sessionId}/report`, reportData);
};

export const submitOverallBookingReport = async (bookingId, reportData) => {
  return await api.put(`/bookings/${bookingId}/overall-report`, reportData);
};

export const getAllTeacherPayoutsAdmin = async (filters = {}) => {
  return await api.get('/teacher-payouts', { params: filters });
};

export const updateTeacherPayoutAdmin = async (payoutId, payoutData) => {
  return await api.put(`/teacher-payouts/${payoutId}`, payoutData); 
};

// jika diperlukan untuk mengambil detail satu payout sebelum update (opsional)
export const getTeacherPayoutByIdAdmin = async (payoutId) => {
  return await api.get(`/teacher-payouts/${payoutId}`);
};

export const getMyPayoutsTeacher = async () => {
  return await api.get('/teachers/my-payouts');
}

export const createCourseReview = async (bookingId, reviewData) => {
  return await api.post(`/bookings/${bookingId}/review`, reviewData);
}

export const getCourseReviews = async (courseId) => {
  return await api.get(`/courses/${courseId}/reviews`);
}