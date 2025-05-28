// import { useEffect, useState } from 'react';
// import api from '../lib/api';
// import CourseCard from '../components/CourseCard';
// import Spinner from '../components/Spinner';
// import delay from '../utils/delay';
// import Swal from 'sweetalert2';

// export default function StudentDashboard() {
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error,   setError]   = useState(null);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const promises = [ api.get('/courses') ];
//         if (import.meta.env.DEV) promises.push(delay(500));
//         const [{ data }] = await Promise.all(promises);
//         setCourses(data);
//       } catch (err) {
//         setError(err.response?.data?.message || 'Failed to load courses.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   const handleBook = async courseId => {
//     try {
//       const bookingDate = new Date().toISOString();
//       await api.post('/bookings', { courseId, bookingDate });
//       Swal.fire({
//         icon: "success",
//         text: "Booked successfully!",
//         showConfirmButton: false,
//         timer: 2000
//       })
//     } catch (err) {
//       alert(err.response?.data?.message || 'Booking failed');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Spinner size={62} />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6 text-center text-red-600">
//         <p>{error}</p>
//         <button
//           onClick={() => {
//             setLoading(true);
//             setError(null);
//           }}
//           className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//       {courses.map(c => (
//         <CourseCard key={c.id} course={c} onBook={handleBook} />
//       ))}
//     </div>
//   );
// }

// src/pages/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import { CLASS_LEVELS, CURRICULA } from '../config';

export default function StudentDashboard() {
  const [courses, setCourses]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterClass, setFilterClass]       = useState('');
  const [filterCurriculum, setFilterCurriculum] = useState('');
  const navigate                             = useNavigate();

  // 1) Fetch all courses on mount
  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        const { data } = await api.get('/courses');
        setCourses(data);
      } catch {
        alert('Failed to load courses');
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // 2) Compute filtered list
  const filtered = courses.filter(c => {
    // search by title or description
    if (
      searchTerm &&
      !(
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) {
      return false;
    }
    // filter class level
    if (filterClass && c.classLevel !== filterClass) {
      return false;
    }
    // filter curriculum (skip for UTBK)
    if (filterClass !== 'UTBK' && filterCurriculum && c.curriculum !== filterCurriculum) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ——— Search & Filters ——— */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search courses..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border rounded"
        />

        <select
          value={filterClass}
          onChange={e => {
            setFilterClass(e.target.value);
            setFilterCurriculum(''); // reset curriculum when class changes
          }}
          className="p-2 border rounded"
        >
          <option value="">All Classes</option>
          {CLASS_LEVELS.map(level => (
            <option key={level} value={level}>
              {level.replace('GRADE', 'Kelas ')}{level === 'UTBK' ? ' (UTBK)' : ''}
            </option>
          ))}
        </select>

        {filterClass && filterClass !== 'UTBK' && (
          <select
            value={filterCurriculum}
            onChange={e => setFilterCurriculum(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Curricula</option>
            {CURRICULA.map(cur => (
              <option key={cur} value={cur}>
                {cur === 'MERDEKA' ? 'Kurikulum Merdeka' : 'K13 Revisi'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ——— Course Grid ——— */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-600">No courses found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
            <div key={c.id} className="p-4 border rounded shadow-sm space-y-2">
              <h2 className="text-lg font-semibold">{c.title}</h2>
              <p className="text-sm text-gray-600">
                {c.classLevel === 'UTBK'
                  ? 'UTBK (No curriculum)'
                  : `${c.classLevel.replace('GRADE', 'Grade ')} — ${
                      c.curriculum === 'MERDEKA'
                        ? 'Kurikulum Merdeka'
                        : 'K13 Revisi'
                    }`}
              </p>
              <p className="text-gray-700">{c.description}</p>
              <p className="font-bold">${c.price.toFixed(2)}</p>
              <button
                onClick={() => navigate(`/student/courses/${c.id}`)}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                View & Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
