import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseById, createBooking, getTeacherSchedule } from "../lib/api";
import CheckoutPageSkeleton from '@/components/skeleton/CheckoutPageSkeleton';
import Spinner from '@/components/Spinner';
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { formatCurrencyIDR } from "../utils/formatCurrency";
import CustomDateTimePicker from "@/components/CustomDateTimePicker";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const processSchedule = (scheduleArray) => {
  const timesByDate = {};
  if (!Array.isArray(scheduleArray)) return timesByDate;

  scheduleArray.forEach(item => {
    if (item && item.date) {
      try {
        const d = new Date(item.date);
        if (isNaN(d.getTime())) return;

        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        const timeValue = `${hours}:${minutes}`;

        if (!timesByDate[dateKey]) {
          timesByDate[dateKey] = [];
        }
        timesByDate[dateKey].push(timeValue);
      } catch (e) {
        console.error("Failed to process date:", item.date, e);
      }
    }
  });
  return timesByDate;
};

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user: loggedInUser, loading: authLoading } = useAuth();

  // --- State Management ---
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [disabledTimesByDate, setDisabledTimesByDate] = useState({});
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", address: "",
    sessionDates: [], paymentMethod: "FULL", installments: 2,
  });

  const SESSION_OPTIONS = [6, 12, 24];
  const ALLOWED_INSTALLMENTS = [2, 3];
 
  const [sessionCount, setSessionCount] = useState(SESSION_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) {
        setError("No course ID provided.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const courseResponse = await getCourseById(courseId);
        const courseData = courseResponse.data.data;
        setCourse(courseData);

        if (courseData && courseData.teacherId) {
          const unavailableRes = await getTeacherSchedule(courseData.teacherId);
          const unavailableArr = unavailableRes.data.data || [];
          const processedSchedule = processSchedule(unavailableArr); // Gunakan helper function
          setDisabledTimesByDate(processedSchedule);
        } else {
          throw new Error("Teacher ID not found in the course data response.");
        }
      } catch (err) {
        console.error("Error during data fetch:", err);
        setError(err.message || "Failed to load course details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && loggedInUser) {
      fetchData();
    }
  }, [courseId, authLoading, loggedInUser]);

  useEffect(() => {
    // Inisialisasi data kontak saat user sudah ada
    if (loggedInUser) {
      setForm(f => ({
        ...f,
        fullName: f.fullName || loggedInUser.name || "",
        email: f.email || loggedInUser.email || "",
        phone: f.phone || loggedInUser.phone || "",
      }));
    }
    // Update jumlah date picker saat sessionCount berubah
    setForm(f => ({
      ...f,
      sessionDates: Array(sessionCount).fill(null).map((_, i) => f.sessionDates?.[i] || null),
    }));
  }, [sessionCount, loggedInUser]);

  // real time nonactive times
  const allDisabledTimes = useMemo(() => {
    const combined = JSON.parse(JSON.stringify(disabledTimesByDate));
    form.sessionDates.forEach(date => {
      if (!date) return;
      const d = new Date(date);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const timeValue = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      if (!combined[dateKey]) combined[dateKey] = [];
      if (!combined[dateKey].includes(timeValue)) combined[dateKey].push(timeValue);
    });
    return combined;
  }, [disabledTimesByDate, form.sessionDates]);

  const paymentDetails = useMemo(() => {
    if (!course) return { total: 0, firstPayment: 0 };
    const total = course.price * sessionCount;
    let firstPayment = total;
    if (form.paymentMethod === "INSTALLMENT") {
      firstPayment = total / form.installments;
    }
    return { total, firstPayment: Math.round(firstPayment) };
  }, [course, sessionCount, form.paymentMethod, form.installments]);


  // HANDLE FORM
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "sessionCount") {
      setSessionCount(Number(value));
      return;
    }
    if (name === "paymentMethod") {
      setForm((f) => ({ ...f, paymentMethod: value }));
      return;
    }
    setForm((f) => ({
      ...f,
      [name]: name === "installments" ? Number(value) : value,
    }));
  };

  // Change single session datetime
  const handleSessionDateChange = (idx, date) => {
    setForm((f) => {
      const arr = [...f.sessionDates];
      arr[idx] = date;
      return { ...f, sessionDates: arr };
    });
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.sessionDates.some((d) => !d)) {
      Swal.fire("Incomplete Data", "Please pick all session dates & times.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingPayload = {
        courseId,
        studentFullName: form.fullName,
        studentEmail: form.email,
        studentPhone: form.phone,
        address: form.address,
        sessionDates: form.sessionDates.map((d) => d.toISOString()),
        paymentMethod: form.paymentMethod,
        ...(form.paymentMethod === "INSTALLMENT"
          ? { installments: form.installments }
          : {}),
      };

      const response = await createBooking(bookingPayload);
      const newBookingId = response.data.id;
      Swal.fire({
        icon: "success",
        title: "Booking Confirmed!",
        text: "You will now be redirected to the payment page.",
        timer: 2500,
        showConfirmButton: false,
        willClose: () => {
          navigate(`/student/bookings/${newBookingId}/pay`); // redirect to payment page
        },
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Booking Failed",
        text: err.response?.data?.message || "Failed to create booking.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // RENDER 
  if (authLoading || isLoading) {
    return <CheckoutPageSkeleton/>
  }
  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }
  if (!course) {
    return <div className="p-6 text-center text-gray-500">Course not found.</div>;
  }

  return (
    <>
    <div>
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Button onClick={() => navigate('/student')} variant='ghost'>
            Home
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
        <BreadcrumbItem>
          <Button onClick={() => navigate(-1)} variant='ghost'>
            Detail Kursus
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
        <BreadcrumbItem>
          <BreadcrumbPage>
            Checkout
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    </div>
    <div className="bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12"
        >
          {/* LEFT: Form */}
          <div className="lg:col-span-2 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Detail Booking</h1>
            {/* Contact */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">
                1. Informasi Kontak
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Alamat Lengkap
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    rows="3"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
            </div>
            {/* Schedule Sessions */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">
                2. Jadwal untuk {sessionCount} Sesi
              </h2>
              <div className="mb-4">
                <label htmlFor="sessionCount" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Sesi
                </label>
                <select
                  id="sessionCount"
                  name="sessionCount"
                  value={sessionCount}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  {SESSION_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} Sessions
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.sessionDates.map((dateValue, i) => (
                  <div key={i}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Sesi {i + 1}
                    </label>
                    <CustomDateTimePicker
                      value={dateValue}
                      onChange={(d) => handleSessionDateChange(i, d)}
                      disabledTimesByDate={allDisabledTimes}
                      unavailableDates={Object.keys(allDisabledTimes)}
                      minDate={new Date()}
                      label={`Select date & time`}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Payment */}
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">
                3. Metode Pembayaran
              </h2>
              <div className="space-y-4">
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                    form.paymentMethod === "FULL"
                      ? "border-indigo-600 ring-2 ring-indigo-200"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="FULL"
                    checked={form.paymentMethod === "FULL"}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-3 font-medium text-gray-800">Full Payment</span>
                </label>
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                    form.paymentMethod === "INSTALLMENT"
                      ? "border-indigo-600 ring-2 ring-indigo-200"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="INSTALLMENT"
                    checked={form.paymentMethod === "INSTALLMENT"}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-3 font-medium text-gray-800">Installments</span>
                </label>
              </div>
              {form.paymentMethod === "INSTALLMENT" && (
                <div className="mt-4 pl-8">
                  <label htmlFor="installments" className="block text-sm font-medium text-gray-700">
                    Number of Installments
                  </label>
                  <select
                    id="installments"
                    name="installments"
                    value={form.installments}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                  >
                    {ALLOWED_INSTALLMENTS.map((n) => (
                      <option key={n} value={n}>
                        {n} times
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          {/* RIGHT: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-56">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kursus:</span>
                  <span className="font-medium text-right">{course.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrencyIDR(course.price)} x {sessionCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {form.paymentMethod === "INSTALLMENT"
                      ? `${form.installments}x Installments`
                      : "Full Payment"}
                  </span>
                </div>
              </div>
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-800">
                    {form.paymentMethod === "FULL"
                      ? "Total Payment:"
                      : "First Payment Due:"}
                  </span>
                  <span className="text-indigo-600">
                    {formatCurrencyIDR(paymentDetails.firstPayment)}
                  </span>
                </div>
                {form.paymentMethod === "INSTALLMENT" && (
                  <p className="text-xs text-gray-500 text-right">
                    (Total Course Price: {formatCurrencyIDR(paymentDetails.total)})
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || authLoading}
                className="mt-6 w-full text-white py-3 px-4 rounded-md font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={20} className="mr-2" /> Processing...
                  </>
                ) : (
                  "Confirm & Proceed"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}