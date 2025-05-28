// src/pages/StudentBooking.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'

export default function StudentBooking() {
  const { courseId } = useParams()
  const navigate     = useNavigate()

  const [course, setCourse]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // form state
  const [form, setForm] = useState({
    address:       '',
    sessionDates:  [],
    paymentMethod: 'FULL',   // FULL or INSTALLMENT
    installments:  2         // only used if INSTALLMENT
  })

  // Load course and init sessionDates
  useEffect(() => {
    let canceled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/courses/${courseId}`)
        if (canceled) return
        setCourse(data)
        setForm(f => ({
          ...f,
          sessionDates: Array(data.numberOfSessions).fill(''),
          // keep paymentMethod/installments from default
        }))
      } catch {
        if (!canceled) setError('Failed to load course')
      } finally {
        if (!canceled) setLoading(false)
      }
    })()
    return () => { canceled = true }
  }, [courseId])

  const handleChange = e => {
    const { name, value } = e.target

    // session-x inputs
    if (name.startsWith('session-')) {
      const idx = Number(name.split('-')[1])
      setForm(f => {
        const d = [...f.sessionDates]
        d[idx] = value
        return { ...f, sessionDates: d }
      })
      return
    }

    // installments or address or paymentMethod
    setForm(f => ({
      ...f,
      [name]: name === 'installments'
        ? Number(value)
        : value
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)

    try {
      await api.post('/bookings', {
        courseId,
        address:      form.address,
        sessionDates: form.sessionDates,
        paymentMethod: form.paymentMethod,
        // only send installments if INSTALLMENT
        ...(form.paymentMethod === 'INSTALLMENT'
          ? { installments: form.installments }
          : {})
      })
      alert('Booking confirmed!')
      navigate('/student')
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed')
    }
  }

  if (loading) return <Spinner size={48} />
  if (error)   return <p className="text-red-600 p-6">{error}</p>

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Book: {course.title}</h1>
      <p className="text-gray-700">{course.description}</p>
      <p><strong>Price:</strong> ${course.price.toFixed(2)}</p>
      <p>
        <strong>Sessions:</strong> {course.numberOfSessions} &nbsp;|&nbsp;
        <strong>Class:</strong>{' '}
        {course.classLevel.replace('GRADE','Grade ')}
      </p>
      {course.classLevel !== 'UTBK' && (
        <p>
          <strong>Curriculum:</strong>{' '}
          {course.curriculum === 'MERDEKA'
            ? 'Kurikulum Merdeka'
            : 'K13 Revisi'}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Address */}
        <div>
          <label className="block font-medium">Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Session picks */}
        <div>
          <h2 className="font-semibold">
            Pick {course.numberOfSessions} Session Date
            {course.numberOfSessions > 1 && 's'}
          </h2>
          {form.sessionDates.map((val, i) => (
            <div key={i} className="mt-2">
              <label className="block">Session {i+1}</label>
              <input
                type="date"
                name={`session-${i}`}
                value={val}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
        </div>

        {/* Payment method */}
        <div>
          <h2 className="font-semibold">Payment</h2>
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              name="paymentMethod"
              value="FULL"
              checked={form.paymentMethod === 'FULL'}
              onChange={handleChange}
              className="mr-1"
            />
            Full payment
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="INSTALLMENT"
              checked={form.paymentMethod === 'INSTALLMENT'}
              onChange={handleChange}
              className="mr-1"
            />
            Installments
          </label>
        </div>

        {/* # of installments */}
        {form.paymentMethod === 'INSTALLMENT' && (
          <div>
            <label className="block font-medium">
              Number of installments
            </label>
            <select
              name="installments"
              value={form.installments}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              {[2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n}×</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Confirm Booking
        </button>
      </form>
    </div>
  )
}
