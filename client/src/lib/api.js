import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// handle get all courses
export const getAllCourses = (params) => {
  return api.get('/courses', { params });
};

export const getMyTeacherCourses = () => {
  return api.get('/courses'); 
};

// handle get teacher dashboard
export const getTeacherDashboardStats = async () => {
  return await api.get('/teachers');
}

// handle get course by ID
export const getCourseById = async (courseId) => {
  return await api.get(`/courses/${courseId}`);
}

/// handle delete course
export const deleteCourse = async (id) => {
  return await api.delete(`/courses/${id}`);
}

// handle create course
export const createCourse = async (formData) => {
  return await api.post('/courses', formData, {
  });
}

export const updateCourse = async (courseId, formData) => {
  if (!(formData instanceof FormData)) {
    console.error('[ERROR] updateCourse: Payload BUKAN FormData!', formData);
  }
  return await api.put(`/courses/${courseId}/update`, formData, {
  });
}

// handle create booking
export const createBooking = async (bookingData) => {
  return await api.post(`/bookings`, bookingData);
}

// handle update booking status
export const updateBookingStatus = async (id, newStatus) => {
  return await api.put(`/bookings/${id}`, {status: newStatus})
}

// handle update booking
export const updateBooking = async (bookingId, bookingData) => {
  return await api.put(`/bookings/${bookingId}`, bookingData)
}

// handle get all bookings
export const getAllBookings = async (params = {}) => {
  return await api.get('/bookings', { params });
}

// handle get booking by ID
export const getBookingById = async (bookingId) => {
  return await api.get(`/bookings/${bookingId}`);
}

// handle get all users
export const getAllUsers = async (params = {}) => {
  return await api.get('/users', { params });
}

// handle create user
export const createUser = async (userData) => {
  return await api.post(`/users`, userData);
}

// handle update user
export const updateUser = async (userId, userData) => {
  return await api.put(`/users/${userId}`, userData);
}

// handle get my profile
export const getMyProfile = async () => {
  return await api.get('/users/me')
}

//handle change password
export const changePassword = (data) => {
  return api.put('/users/me/change-password', data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// handle delete user
export const deleteUser = async (userId) => {
  return await api.delete(`/users/${userId}`);
}

// handle get all payments
export const getAllPayments = async () => {
  return await api.get('/payments');
}

// handle update payment status
export const updatePayment = async (paymentId, paymentData) => {
  return await api.put(`/payments/${paymentId}`, paymentData);
}

// handle submit session report 
export const updateSessionReport = async (sessionId, reportData) => {
  const formData = new FormData();

  if (reportData.teacherReport !== undefined) {
    formData.append('teacherReport', reportData.teacherReport);
  }
  if (reportData.studentAttendance !== undefined) {
    formData.append('studentAttendance', reportData.studentAttendance);
  }
  if (reportData.status) {
    formData.append('status', reportData.status);
  }
  if (reportData.sessionFile) {
    formData.append('sessionFile', reportData.sessionFile);
  }

  return await api.put(`/bookingsessions/${sessionId}/report`, formData);
};

// handle submit overall booking report
export const submitOverallBookingReport = async (bookingId, reportData) => {
  return await api.put(`/bookings/${bookingId}/overall-report`, reportData);
};

// handle gett all teacher payouts by admin
export const getAllTeacherPayoutsAdmin = async (filters = {}) => {
  return await api.get('/teacher-payouts', { params: filters });
};

// handle update teacher payout by admin
export const updateTeacherPayoutAdmin = async (payoutId, payoutData) => {
  const formData = new FormData();

  Object.keys(payoutData).forEach(key => {
    const value = payoutData[key];
    if (value instanceof File) {
      formData.append(key, value);
    } else if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });
  
  return await api.put(`/teacher-payouts/${payoutId}`, formData, {
    headers: {
      // 'Content-Type': 'multipart/form-data',
    },
  }); 
};

// handle get payout by ID by admin
export const getTeacherPayoutByIdAdmin = async (payoutId) => {
  return await api.get(`/teacher-payouts/${payoutId}`);
};

// handle get all payouts for teacher
export const getMyPayoutsTeacher = async () => {
  return await api.get('/teachers/my-payouts');
}

export const getSessionsByPayoutId = async (payoutId) => {
  return await api.get(`/teacher-payouts/${payoutId}/sessions`);
}

// handle create course review
export const createCourseReview = async (bookingId, reviewData) => {
  return await api.post(`/bookings/${bookingId}/review`, reviewData);
}


// handle get all course reviews
export const getCourseReviews = async (courseId) => {
  return await api.get(`/courses/${courseId}/reviews`);
}

// handle get all bookings for teacher
export const updateStudentAttendance = async (sessionId) => {
  return await api.put(`/bookingsessions/${sessionId}/attendance`, {});
}

// handle get active payment options
export const getActivePaymentOptions = async () => {
  return await api.get('/payment-options');
};

// handle get all payment options by admin
export const getAllPaymentOptionsAdmin = async () => {
  return await api.get('/admin/payment-options');
};


// handle create payment option by admin
export const createPaymentOptionAdmin = async (data) => {
  return await api.post('/admin/payment-options', data);
};


// handle update payment option by admin
export const updatePaymentOptionAdmin = async (id, data) => {
  return await api.put(`/admin/payment-options/${id}`, data);
};

// handle delete payment option by admin
export const deletePaymentOptionAdmin = async (id) => {
  return await api.delete(`/admin/payment-options/${id}`);
};

// handle payment proof upload
export const uploadProofOfPayment = async (paymentId, file) => {
  const formData = new FormData();
  formData.append('proof', file);

  return await api.post(`/payments/${paymentId}/upload-proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// handle get all payment proofs
export const getPaymentProofs = async (paymentId) => {
  return await api.get(`/payments/${paymentId}/proofs`);
};

// handle get admin dashboard stats
export const getAdminDashboardStats = async () => {
  return await api.get('/admin/dashboard/stats');
};

// handle upload course image
export const uploadCourseImage = (courseId, file) => {
  const formData = new FormData();
  formData.append('courseImage', file);
  return api.post(`/courses/${courseId}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// handle upload user avatar
export const uploadUserAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post('/users/me/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// handle update teacher payout info
export const updateMyPayoutInfo = async (payoutData) => {
  return await api.put('/users/me/payout-info', payoutData);
};

// --- Application Settings ---
export const getAppSettings = async () => {
  return await api.get('/admin/settings');
};

export const updateAppSettings = async (settingsData) => {
  return await api.put('/admin/settings', settingsData);
};

// --- Teacher Availability ---
export const getMyUnavailableDates = async () => {
  return await api.get('/availability');
};

// export const addUnavailableDate = async (date) => {
//   return await api.post('/availability', { date });
// };

/**
 * Menambahkan beberapa slot waktu tidak tersedia untuk guru.
 * @param {string[]} datesArray - Sebuah array berisi tanggal dalam format ISO string.
 * @returns {Promise}
 */
export const addUnavailableSlots = (datesArray) => {
  return api.post('/availability/slots', { dates: datesArray });
};

export const deleteUnavailableDate = async (id) => {
  return await api.delete(`/availability/${id}`);
};


export const getTeacherSchedule = async (id) => {
  return await api.get(`/availability/schedule/${id}`)
}


export const getTeacherProfile = async (teacherId) => {
  return await api.get(`/teachers/${teacherId}/profile`)
}


// handle notifications
export const getNotifications = async (params) => {
  return await api.get('/notifications', { params })
}

export const markNotificationsAsRead = async (type) => {
  return api.post(`/notifications/mark-as-read${type ? `?type=${type}` : ''}`);
}

// hanle chat
export const getMyConversations = async () => {
  return await api.get(`/conversations/my`)
}

// export const getMessagesByBookingId = async (bookingId) => {
//   return await api.get(`/conversations/${bookingId}/message`)
// }

export const getMessagesByConversationId = async (conversationId) => {
  return await api.get(`/conversations/${conversationId}/message`)
}

export const markConversationAsRead = async (conversationId) => {
  return await api.post(`/conversations/${conversationId}/mark-as-read`)
}

/**
 * Mengambil data agregasi honorarium yang belum dibayar dalam rentang tanggal tertentu.
 * @param {string} startDate - Tanggal mulai (format ISO YYYY-MM-DD).
 * @param {string} endDate - Tanggal akhir (format ISO YYYY-MM-DD).
 * @returns {Promise}
 */
export const getPendingHonorariums = (startDate, endDate) => {
  return api.get('/honorariums/pending', {
    params: { startDate, endDate }
  });
};

/**
 * Memproses honorarium yang dipilih untuk membuat record TeacherPayout.
 * @param {Array} payouts - Array dari objek honorarium yang akan diproses.
 * @param {string} periodStartDate - Tanggal mulai periode.
 * @param {string} periodEndDate - Tanggal akhir periode.
 * @returns {Promise}
 */
export const processHonorariumPayouts = (payouts, periodStartDate, periodEndDate) => {
  return api.post('/honorariums/process', { 
    payouts,
    periodStartDate,
    periodEndDate 
  });
};

// handle categories
export const getAllCategories = async () => {
  return await api.get('/categories');
};

export const createCategory = async (categoryData) => {
  return await api.post('/categories', categoryData);
};

export const updateCategory = async (id, categoryData) => {
  return await api.put(`/categories/${id}`, categoryData);
};

export const deleteCategory = async (id) => {
  return await api.delete(`/categories/${id}`);
};