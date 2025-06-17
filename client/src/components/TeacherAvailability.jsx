import React, { useEffect, useState, useCallback } from 'react';
import { getMyUnavailableDates, addUnavailableDate, deleteUnavailableDate } from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO, isBefore } from 'date-fns';
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
    if (isBefore(new Date(newDate), new Date().setHours(0,0,0,0))) {
      Swal.fire('Invalid Date', 'Cannot set unavailable date in the past.', 'warning');
      return;
    }
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

  if (isLoading) return <div className="flex justify-center items-center h-40"><Spinner size={40} /></div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Unavailable Dates</h2>
      <div className="flex items-center gap-2 mb-4">
        <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />
        <Button onClick={handleAdd} disabled={!newDate}>Add</Button>
      </div>
      {dates.length === 0 ? (
        <p className="text-gray-500">No unavailable dates set.</p>
      ) : (
        <ul className="space-y-2">
          {dates
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(d => (
            <li key={d.id} className="flex justify-between items-center bg-white p-3 rounded shadow">
              <span>
                <span className="font-medium">{format(parseISO(d.date), 'EEEE')}</span>
                <span className="ml-2 text-gray-600">{format(parseISO(d.date), 'dd MMM yyyy')}</span>
              </span>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(d.id)}>Delete</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
