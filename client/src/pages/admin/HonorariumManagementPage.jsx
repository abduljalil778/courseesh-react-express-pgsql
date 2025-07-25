import React, { useEffect, useState, useCallback, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getPendingHonorariums, processHonorariumPayouts } from "../../lib/api";
import { formatCurrencyIDR } from "../../utils/formatCurrency";
import Spinner from "../../components/Spinner";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

// Komponen baru untuk Date Range Picker
const DateRangePicker = ({ dateRange, setDateRange }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
              </>
            ) : (
              format(dateRange.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange.from}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
};


export default function PayoutManagementPage() {
  const [honorariums, setHonorariums] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State untuk date-range picker dan baris yang dipilih
  const [dateRange, setDateRange] = useState({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Logika untuk memuat data honorarium
  const loadHonorariums = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPendingHonorariums(
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd')
      );
      setHonorariums(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load honorariums.");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadHonorariums();
  }, [loadHonorariums]);

  // Handle pemilihan baris
  const handleSelectRow = (teacherId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(honorariums.map(h => h.teacherId)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Handle proses payout
  const handleProcessPayouts = async () => {
    if (selectedRows.size === 0) {
      Swal.fire("No Selection", "Please select at least one teacher to process.", "warning");
      return;
    }
    const payoutsToProcess = honorariums.filter(h => selectedRows.has(h.teacherId));
    
    const { isConfirmed } = await Swal.fire({
        title: `Process ${payoutsToProcess.length} Payout(s)?`,
        text: `This will create official payout records for the selected teachers.`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Yes, process it!'
    });

    if (isConfirmed) {
        try {
            await processHonorariumPayouts(payoutsToProcess, dateRange.from.toISOString(), dateRange.to.toISOString());
            Swal.fire('Success!', 'Payout records have been created.', 'success');
            setSelectedRows(new Set());
            loadHonorariums(); // Muat ulang data
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Could not process payouts.', 'error');
        }
    }
  };
  
  const totalSelectedAmount = useMemo(() => {
    return honorariums
      .filter(h => selectedRows.has(h.teacherId))
      .reduce((sum, h) => sum + h.totalHonorarium, 0);
  }, [honorariums, selectedRows]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pending Honorariums</h1>
          <p className="text-sm text-gray-500">View and process teacher payouts based on completed sessions.</p>
        </div>
        <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">
                <Checkbox onCheckedChange={(checked) => handleSelectAll({ target: { checked } })} />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sesi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Honorarium Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="4" className="text-center p-8"><Spinner /></td></tr>
            ) : error ? (
              <tr><td colSpan="4" className="text-center p-8 text-red-500">{error}</td></tr>
            ) : honorariums.length > 0 ? (
              honorariums.map((h) => (
                <tr key={h.teacherId}>
                  <td className="p-4"><Checkbox checked={selectedRows.has(h.teacherId)} onCheckedChange={() => handleSelectRow(h.teacherId)} /></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{h.teacherName}</div>
                    <div className="text-xs text-gray-500">{h.teacherEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{h.totalSessions}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{formatCurrencyIDR(h.totalHonorarium)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="text-center p-8 text-gray-500">No pending honorariums found for this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 p-4 bg-gray-50 rounded-lg shadow">
        <div className="text-sm">
            <span className="font-semibold">{selectedRows.size}</span> teacher(s) selected
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-xs text-gray-500">Total Selected</p>
                <p className="text-lg font-bold">{formatCurrencyIDR(totalSelectedAmount)}</p>
            </div>
            <Button onClick={handleProcessPayouts} disabled={selectedRows.size === 0}>
                Process {selectedRows.size} Payout(s)
            </Button>
        </div>
      </div>
    </div>
  );
}
