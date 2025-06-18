import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getMyUnavailableDates, addUnavailableSlots, deleteUnavailableDate } from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const generateTimeSlots = (start = "07:00", end = "21:00", step = 30) => {
  const slots = [];
  let currentTime = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  while (currentTime <= endTime) {
    slots.push(format(currentTime, "HH:mm"));
    currentTime.setMinutes(currentTime.getMinutes() + step);
  }
  return slots;
};

export default function TeacherAvailability() {
  const [unavailableEntries, setUnavailableEntries] = useState([]); // Menyimpan data lengkap dari API [{id, date}]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk UI interaktif
  const [selectedDay, setSelectedDay] = useState(null); // Hari yang dipilih di kalender
  const [selectedTimes, setSelectedTimes] = useState([]); // Jam yang dicentang untuk hari terpilih

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // --- Data Fetching ---
  const loadDates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMyUnavailableDates();
      setUnavailableEntries(res.data || []); // Disesuaikan dengan struktur response API Anda
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load unavailability data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  // --- Data Processing ---
  // Membuat map dari jadwal yang sudah ada untuk pengecekan cepat
  const existingUnavailableMap = useMemo(() => {
    const map = {};
    unavailableEntries.forEach(entry => {
      const d = parseISO(entry.date);
      const dateKey = format(d, "yyyy-MM-dd");
      const timeValue = format(d, "HH:mm");
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(timeValue);
    });
    return map;
  }, [unavailableEntries]);

  // --- Handlers ---
  const handleDaySelect = (day) => {
    // Jangan izinkan memilih hari di masa lalu
    if (isBefore(day, new Date().setHours(0,0,0,0))) {
      return;
    }
    setSelectedDay(day);
    setSelectedTimes([]); // Reset pilihan jam setiap kali ganti hari
  };

  const handleTimeToggle = (time) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time) // Hapus jika sudah ada (uncheck)
        : [...prev, time] // Tambahkan jika belum ada (check)
    );
  };

  const handleAddTimes = async () => {
    if (!selectedDay || selectedTimes.length === 0) return;

    setIsSubmitting(true);
    // Buat array dari tanggal ISO string lengkap
    const datesToAdd = selectedTimes.map(time => {
      const [hours, minutes] = time.split(':');
      const dateObj = new Date(selectedDay);
      dateObj.setHours(hours, minutes, 0, 0);
      return dateObj.toISOString();
    });

    try {
      // Panggil API baru yang bisa menerima array
      await addUnavailableSlots({ dates: datesToAdd });
      Swal.fire('Success', 'Unavailable slots have been added.', 'success');
      setSelectedDay(null);
      setSelectedTimes([]);
      await loadDates(); // Muat ulang data
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to add slots', 'error');
    } finally {
      setIsSubmitting(false);
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

  const formattedSelectedDay = selectedDay ? format(selectedDay, 'EEEE, dd MMM yyyy') : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Kolom Kiri: Kalender dan Daftar Jadwal */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Set Your Unavailability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Select a day on the calendar to manage unavailable time slots for that day.</p>
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={handleDaySelect}
              className="rounded-md border"
              // Modifiers untuk menandai hari yang sudah ada jadwal unavailable
              modifiers={{ hasUnavailable: (date) => existingUnavailableMap[format(date, 'yyyy-MM-dd')] }}
              modifiersStyles={{ hasUnavailable: { fontWeight: 'bold', textDecoration: 'underline' } }}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Current Unavailable Slots</CardTitle>
          </CardHeader>
          <CardContent>
            {unavailableEntries.length === 0 ? (
              <p className="text-gray-500">No unavailable dates set.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {unavailableEntries
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(d => (
                  <li key={d.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span>
                      <span className="font-medium">{format(parseISO(d.date), 'EEEE, dd MMM yyyy')}</span>
                      <span className="ml-3 text-gray-800 bg-gray-200 px-2 py-1 rounded-full text-sm">{format(parseISO(d.date), 'HH:mm')}</span>
                    </span>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(d.id)}>Delete</Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kolom Kanan: Panel Pemilihan Jam */}
      <div className="lg:col-span-1">
        {selectedDay && (
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Select Times for</CardTitle>
              <p className="text-indigo-600 font-medium">{formattedSelectedDay}</p>
            </CardHeader>
            <CardContent className="max-h-[50vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(time => {
                  const isAlreadySet = existingUnavailableMap[format(selectedDay, 'yyyy-MM-dd')]?.includes(time);
                  return (
                    <div key={time} className="flex items-center">
                      <Checkbox
                        id={`time-${time}`}
                        checked={selectedTimes.includes(time)}
                        onCheckedChange={() => handleTimeToggle(time)}
                        disabled={isAlreadySet}
                      />
                      <label
                        htmlFor={`time-${time}`}
                        className={`ml-2 text-sm ${isAlreadySet ? 'text-gray-400 line-through' : 'cursor-pointer'}`}
                      >
                        {time}
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddTimes} disabled={selectedTimes.length === 0 || isSubmitting} className="w-full">
                {isSubmitting ? <Spinner size={20} /> : `Add ${selectedTimes.length} Selected Times`}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}