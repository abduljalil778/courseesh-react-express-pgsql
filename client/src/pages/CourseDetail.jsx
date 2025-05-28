// src/pages/CourseDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect }      from 'react';
import api                          from '../lib/api';
import Spinner                      from '../components/Spinner';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [course, setCourse]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // 1️⃣ Fetch the single course
  useEffect(() => {
    if (!courseId) {
      setError('No course specified.');
      setLoading(false);
      return;
    }

    api
      .get(`/courses/${courseId}`)
      .then((res) => setCourse(res.data))
      .catch(() => setError('Failed to load course.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  // 3️⃣ UI states
  if (loading) return <Spinner />;
  if (error)   return <div className="p-6 text-red-600">{error}</div>;
  if (!course) return <div className="p-6">Course not found.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
      <p className="mb-1">
        <strong>Teacher:</strong> {course.teacher?.name}
      </p>
      <p className="mb-1">
        <strong>Description:</strong> {course.description}
      </p>
      <p className="mb-1">
        <strong>Price:</strong> ${course.price}
      </p>
      <p className="mb-1">
        <strong>Sessions:</strong> {course.numberOfSessions}
      </p>
      <p className="mb-6">
        <strong>Class:</strong> {course.classLevel}
      </p>
        <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => navigate(`/student/book/${courseId}`)}
        >
        Book Now
        </button>
        
    </div>
  );
}
