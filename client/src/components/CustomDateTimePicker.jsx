import React, { useState, useMemo, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, isBefore, startOfDay, isToday } from "date-fns";
import { InfoIcon, Calendar as CalendarIcon } from "lucide-react";
import { generateTimeSlots } from '@/utils/timeUtils';

// Helper function untuk padding nol (misal: 7 -> "07")
function pad(n) {
  return n.toString().padStart(2, "0");
}

export default function CustomDateTimePicker({
  value, // Tipe: Date object atau null
  onChange,
  label = "Select date & time",
  unavailableDates = [], // Tipe: string[] ["YYYY-MM-DD"]
  disabledTimesByDate = {}, // Tipe: object {"YYYY-MM-DD": ["HH:mm"]}
  minDate = new Date(),
  timeStep = 120,
  minTime = "07:00",
  maxTime = "21:00",
}) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [selectedTime, setSelectedTime] = useState(value ? format(new Date(value), "HH:mm") : null);
  const [error, setError] = useState("");

  // Sinkronisasi state internal dengan prop dari luar jika berubah
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setSelectedTime(format(new Date(value), "HH:mm"));
    } else {
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [value]);

  // Generate opsi waktu (misal: ["07:00", "07:30", ...])
  const timeOptions = useMemo(() => {
    return generateTimeSlots(minTime, maxTime, timeStep)
  }, [minTime, maxTime, timeStep]);

  // Set untuk pencarian tanggal unavailable yang lebih cepat
  const unavailableDateSet = useMemo(() => new Set(unavailableDates), [unavailableDates]);

  // Fungsi untuk menonaktifkan hari di kalender
  function isDayDisabled(day) {
    // Nonaktifkan hari sebelum hari ini
    if (isBefore(day, startOfDay(minDate))) {
      return true;
    }
    // Nonaktifkan hari yang ada di daftar `unavailableDates` (opsional, untuk performa)
    const ymd = format(day, "yyyy-MM-dd");
    // return unavailableDateSet.has(ymd);
  }

  // FUNGSI INTI UNTUK MENONAKTIFKAN JAM
  function isTimeDisabled(timeString) {
    if (!selectedDate) return true; // Jika tanggal belum dipilih, semua jam disable

    // 1. Cek apakah jam ini ada di daftar `disabledTimesByDate`
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const disabledTimesForSelectedDay = disabledTimesByDate[dateKey]; // e.g., ["07:30", "08:00"]

    if (disabledTimesForSelectedDay && disabledTimesForSelectedDay.includes(timeString)) {
      return true; // Ditemukan jadwal konflik, maka jam ini di-disable
    }

    // 2. Cek apakah jam ini sudah lewat (jika tanggal yang dipilih adalah hari ini)
    if (isToday(selectedDate)) {
      const now = new Date();
      const [h, m] = timeString.split(":");
      const candidateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      if (isBefore(candidateTime, now)) {
        return true; // Jam sudah lewat, maka di-disable
      }
    }

    return false; // Jika lolos semua pengecekan, jam ini bisa dipilih
  }

  // Fungsi yang dijalankan saat tanggal dan jam sudah final dipilih
  function handleSelect() {
    if (!selectedDate || !selectedTime) return;

    const [h, m] = selectedTime.split(":");
    const mergedDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h, m
    );

    if (isBefore(mergedDateTime, new Date())) {
      setError("Date and time cannot be in the past.");
      return;
    }

    setError("");
    onChange(mergedDateTime); // Kirim data ke parent component
    setOpen(false); // Tutup popover
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "eee, dd MMM yyyy, HH:mm") : <span>{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <h3 className="font-semibold mb-2 text-center">Pilih Tanggal</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(day) => {
            if (day && !isDayDisabled(day)) {
              setSelectedDate(day);
              setError("");
            }
          }}
          disabled={isDayDisabled}
          initialFocus
        />
        
        {selectedDate && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-center">Pilih Jam</h3>
            <div className="grid grid-cols-4 gap-2">
              {timeOptions.map((time) => {
                const isDisabled = isTimeDisabled(time); // Panggil fungsi pengecekan
                return (
                  <Button
                    key={time}
                    size="sm"
                    variant={selectedTime === time ? "default" : "outline"}
                    disabled={isDisabled}
                    onClick={() => {
                      setSelectedTime(time);
                    }}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center text-xs mt-3 text-red-500">
            <InfoIcon className="w-4 h-4 mr-1" /> {error}
          </div>
        )}

        {selectedDate && selectedTime && (
          <Button onClick={handleSelect} className="w-full mt-4">
            Confirm
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}