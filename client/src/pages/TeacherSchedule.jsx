// src/pages/TeacherSchedule.jsx
import { useEffect, useState } from 'react';
import api from '../lib/api';
import Spinner from '../components/Spinner';

export default function TeacherSchedule() {
  const [courses,   setCourses]   = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // form state
  const [form, setForm]     = useState({
    courseId: '',
    startTime: '',
    endTime:   ''
  });
  const [editing, setEditing] = useState(null); // the slot being edited

  // load courses + schedules
  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/courses'),
        api.get('/schedules')
      ]);
      setCourses(cRes.data);
      setSchedules(sRes.data);
    } catch {
      alert('Could not load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // handle form field changes
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // create or update slot
  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      courseId:  form.courseId,
      startTime: new Date(form.startTime).toISOString(),
      endTime:   new Date(form.endTime).toISOString()
    };

    try {
      if (editing) {
        await api.put(`/schedules/${editing.id}`, payload);
      } else {
        await api.post('/schedules', payload);
      }
      // reset form
      setForm({ courseId: '', startTime: '', endTime: '' });
      setEditing(null);
      loadData();
    } catch {
      alert(`Failed to ${editing ? 'update' : 'create'} slot`);
    }
  };

  // start editing an existing slot
  const handleEdit = slot => {
    setEditing(slot);
    // populate form in ISO-date sub-string form
    setForm({
      courseId:  slot.courseId,
      startTime: slot.startTime.slice(0, 16),
      endTime:   slot.endTime.slice(0, 16)
    });
  };

  // delete slot
  const handleDelete = async id => {
    if (!confirm('Delete this slot?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      loadData();
    } catch {
      alert('Failed to delete slot');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Form */}
      <h1 className="text-2xl font-bold">
        {editing ? 'Edit Slot' : 'New Slot'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <select
          name="courseId"
          value={form.courseId}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Select Course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <div>
          <label className="block text-sm">Start Time</label>
          <input
            type="datetime-local"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm">End Time</label>
          <input
            type="datetime-local"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {editing ? 'Update Slot' : 'Create Slot'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ courseId: '', startTime: '', endTime: '' });
              }}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List of Slots */}
      <h2 className="text-2xl font-bold">My Available Slots</h2>
      <ul className="space-y-2">
        {schedules.map(s => (
          <li
            key={s.id}
            className="p-4 border rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{s.course.title}</p>
              <p>
                {new Date(s.startTime).toLocaleString()} —{' '}
                {new Date(s.endTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(s)}
                className="px-2 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="px-2 py-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
