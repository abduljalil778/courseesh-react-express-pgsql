import React, { useState, useMemo } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, isBefore, isEqual, isToday, isSameDay } from "date-fns";
import { InfoIcon } from "lucide-react";

function pad(n) { return n.toString().padStart(2, "0"); }

// === Main Custom Date Time Picker ===
export default function CustomDateTimePicker({
  value, // JS Date or null
  onChange, // function(date)
  label = "Select date & time",
  minDate = new Date(),
  unavailableDates = [], // [YYYY-MM-DD]
  disabledTimesByDate = {}, // {"2024-06-20": ["08:00","09:00"]}
  timeStep = 30, // minutes
  minTime = "07:00",
  maxTime = "21:00",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [selectedTime, setSelectedTime] = useState(value ? format(new Date(value), "HH:mm") : "");
  const [error, setError] = useState("");

  // --- Generate time slots ---
  const timeOptions = useMemo(() => {
    const arr = [];
    const [minH, minM] = minTime.split(":").map(Number);
    const [maxH, maxM] = maxTime.split(":").map(Number);
    let d = new Date(2000, 0, 1, minH, minM);
    const end = new Date(2000, 0, 1, maxH, maxM);
    while (d <= end) {
      arr.push(pad(d.getHours()) + ":" + pad(d.getMinutes()));
      d = new Date(d.getTime() + timeStep * 60000);
    }
    return arr;
  }, [minTime, maxTime, timeStep]);

  // Unavailable: convert array of yyyy-mm-dd to string for quick compare
  const unavailableSet = useMemo(() => new Set(unavailableDates), [unavailableDates]);

  // Helper for disabling calendar days
  function isDayDisabled(date) {
    // Before today/minDate
    if (isBefore(date, minDate)) return true;
    // In unavailableSet
    const ymd = format(date, "yyyy-MM-dd");
    return unavailableSet.has(ymd);
  }

  // Disable times: before now (if today), or from prop
  function isTimeDisabled(date, t) {
    if (!date) return true;
    const ymd = format(date, "yyyy-MM-dd");
    // If selected date is today, disable past times
    if (isToday(date)) {
      const now = new Date();
      const [h, m] = t.split(":");
      const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      if (candidate < now) return true;
    }
    // From backend
    if (disabledTimesByDate[ymd] && disabledTimesByDate[ymd].includes(t)) return true;
    return false;
  }

  // --- Main onChange
  function handleSelect(dt, tm) {
    if (!dt || !tm) return;
    const [h, m] = tm.split(":");
    const merged = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), h, m);
    if (isBefore(merged, minDate)) {
      setError("Date cannot be in the past");
      return;
    }
    setError("");
    onChange(merged);
    setOpen(false);
  }

  // ---- Display: Current Value
  let valueDisplay = label;
  if (selectedDate && selectedTime) {
    valueDisplay = `${format(selectedDate, "eee, dd MMM yyyy")} ${selectedTime}`;
  }

  // --- Sync props <-> local state
  React.useEffect(() => {
    setSelectedDate(value ? new Date(value) : null);
    setSelectedTime(value ? format(new Date(value), "HH:mm") : "");
  }, [value]);

  // --- Main Render ---
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={"justify-between w-full " + className}>
          <span>{valueDisplay}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={date => {
              if (isDayDisabled(date)) {
                setError("Date cannot be in the past or unavailable");
              } else {
                setError("");
                setSelectedDate(date);
              }
            }}
            disabled={isDayDisabled}
            initialFocus
          />
          {selectedDate && (
            <div className="mt-4">
              <div className="font-semibold text-xs text-gray-500 mb-1">Pick Time</div>
              <div className="grid grid-cols-3 gap-1">
                {timeOptions.map((t) => {
                  const disabled = isTimeDisabled(selectedDate, t);
                  return (
                    <Button
                      key={t}
                      size="sm"
                      variant={selectedTime === t ? "default" : "outline"}
                      disabled={disabled}
                      className={
                        "mb-1" +
                        (disabled ? " opacity-40 cursor-not-allowed" : "")
                      }
                      onClick={() => {
                        if (!disabled) {
                          setSelectedTime(t);
                          handleSelect(selectedDate, t);
                        }
                      }}
                    >
                      {t}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
