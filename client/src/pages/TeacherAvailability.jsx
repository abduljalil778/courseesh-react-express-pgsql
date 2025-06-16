import React, { useEffect, useState, useCallback } from 'react';
import { getMyUnavailableDates, addUnavailableDate, deleteUnavailableDate } from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TeacherAvailability() {
  const [dates, setDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDate, setNewDate] = useState('');

  const loadDates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMyUnavailableDates();
      setDates(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  const handleAdd = async () => {
    if (!newDate) return;
    try {
      await addUnavailableDate(newDate);
      setNewDate('');
      await loadDates();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to add date', 'error');
    }
  };

  const handleDelete = async (id) => {
    const ok = await Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true });
    if (!ok.isConfirmed) return;
    try {
      await deleteUnavailableDate(id);
      await loadDates();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size={60} /></div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">Manage Unavailable Dates</h1>
      <div className="flex items-center gap-2 mb-4">
        <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
        <Button onClick={handleAdd}>Add</Button>
      </div>
      {dates.length === 0 ? (
        <p className="text-gray-500">No unavailable dates set.</p>
      ) : (
        <ul className="space-y-2">
          {dates.map(d => (
            <li key={d.id} className="flex justify-between items-center bg-white p-3 rounded shadow">
              <span>{format(parseISO(d.date), 'EEEE, dd MMM yyyy')}</span>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(d.id)}>Delete</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}