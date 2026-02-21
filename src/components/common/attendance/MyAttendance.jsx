import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Image as ImageIcon, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../../config/api';

// Convert fractional hours to HH:MM:SS for consistent totals and rows
const formatHoursToHMS = (hoursValue) => {
  const totalSeconds = Math.floor((hoursValue || 0) * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function MyAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  
  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentYear = currentDate.getFullYear();
  
  // Generate month options (last 12 months)
  const generateMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({ label: monthName, value: monthValue });
    }
    return options;
  };

  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
    endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
  });
  const [selectedImage, setSelectedImage] = useState(null);

  // Update date range when month changes
  const handleMonthChange = (monthValue) => {
    setSelectedMonth(monthValue);
    const [year, month] = monthValue.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  // Navigate month
  const navigateMonth = (direction) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + direction, 1);
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    handleMonthChange(newMonth);
  };

  useEffect(() => {
    fetchMyAttendance();
    fetchStats();
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/attendance/my-attendance`, {
        params: dateRange,
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(response.data.attendance || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/attendance/stats/summary`, {
        params: dateRange,
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
      case 'On Time': return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800/30';
      case 'Late': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/30';
      case 'Half Day': return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-200 dark:border-orange-800/30';
      case 'Absent': return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800/30';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Generate days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = attendance.find(a => 
        new Date(a.date).toISOString().split('T')[0] === dateStr
      );
      
      const isPast = date < today;
      const isFuture = date > today;
      const isToday = date.getTime() === today.getTime();
      
      days.push({
        day,
        date: dateStr,
        record: attendanceRecord,
        isPast,
        isFuture,
        isToday,
        status: attendanceRecord?.status || (isFuture ? 'upcoming' : 'absent')
      });
    }
    
    return days;
  };

  // Calculate real-time total hours
  const calculateRealTimeTotalHours = () => {
    return attendance.reduce((total, record) => {
      return total + (record.totalHours || 0);
    }, 0);
  };

  // Generate all days of month for table view
  const generateAllDaysForTable = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecord = attendance.find(a => 
        new Date(a.date).toISOString().split('T')[0] === dateStr
      );
      
      const isPast = date < today;
      const isFuture = date > today;
      const isToday = date.getTime() === today.getTime();
      
      allDays.push({
        date: dateStr,
        dateObj: date,
        record: attendanceRecord,
        isPast,
        isFuture,
        isToday,
        status: attendanceRecord?.status || (isFuture ? 'upcoming' : (isPast ? 'Absent' : 'Present'))
      });
    }
    
    return allDays;
  };

  return (
    <div className="p-6 min-h-screen ">
      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'table' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'calendar' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Stats Cards with Real-time Total Hours */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-card  rounded-lg shadow p-4 border border-border">
          <p className="text-sm text-muted-foreground ">Total Days</p>
          <p className="text-2xl font-bold text-foreground ">{stats?.totalDays || 0}</p>
        </div>
        <div className="bg-card  rounded-lg shadow p-4 border border-border">
          <p className="text-sm text-muted-foreground ">Present</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.presentDays || 0}</p>
        </div>
        <div className="bg-card  rounded-lg shadow p-4 border border-border">
          <p className="text-sm text-muted-foreground ">Half Day</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats?.halfDays || 0}</p>
        </div>
        <div className="bg-card  rounded-lg shadow p-4 border border-border">
          <p className="text-sm text-muted-foreground ">Absent</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.absentDays || 0}</p>
        </div>
        <div className="bg-card  rounded-lg shadow p-4 border border-border">
          <p className="text-sm text-muted-foreground ">Total Hours</p>
          <p className="text-2xl font-bold text-foreground">{formatHoursToHMS(calculateRealTimeTotalHours())}</p>
          <p className="text-xs text-muted-foreground  mt-1">Live Calculation</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-card  rounded-lg shadow p-4 mb-6 border border-border">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-muted text-foreground"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-foreground ">
            {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-muted text-foreground"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {generateMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                fetchMyAttendance();
                fetchStats();
              }}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Calendar or Table View */}
      {viewMode === 'calendar' ? (
        <div className="bg-card  rounded-lg shadow p-6 border border-border">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays().map((dayData, index) => (
              <div
                key={index}
                className={`min-h-[100px] border rounded-lg p-2 transition-colors ${
                  dayData
                    ? dayData.isFuture
                      ? 'bg-muted/30 border-border opacity-50'
                      : dayData.isToday
                      ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20'
                      : 'bg-card border-border hover:border-primary/20'
                    : 'bg-transparent border-transparent'
                }`}
              >
                {dayData && (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-semibold ${dayData.isToday ? 'text-primary' : 'text-foreground'}`}>
                        {dayData.day}
                      </span>
                      {dayData.record && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor(dayData.status)}`}>
                          {dayData.status}
                        </span>
                      )}
                      {!dayData.record && !dayData.isFuture && dayData.isPast && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-100 dark:border-red-900/30">
                          Absent
                        </span>
                      )}
                      {dayData.isFuture && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          N/A
                        </span>
                      )}
                    </div>
                    {dayData.record && (
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground ">
                          <Clock size={10} />
                          <span>{formatTime(dayData.record.checkInTime)}</span>
                        </div>
                        {dayData.record.checkOutTime && (
                          <div className="flex items-center gap-1 text-muted-foreground ">
                            <Clock size={10} />
                            <span>{formatTime(dayData.record.checkOutTime)}</span>
                          </div>
                        )}
                        <div className="font-semibold text-foreground ">
                          {formatHoursToHMS(dayData.record.totalHours || 0)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card  rounded-lg shadow overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-muted/50 ">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-muted-foreground ">
                    Loading...
                  </td>
                </tr>
              ) : generateAllDaysForTable().length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-muted-foreground ">
                    No data found
                  </td>
                </tr>
              ) : (
                generateAllDaysForTable().map((dayData) => (
                  <tr key={dayData.date} className={`hover:bg-muted/50 ${dayData.isToday ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        {formatDate(dayData.dateObj)}
                        {dayData.isToday && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Today</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {dayData.record?.shiftId?.shiftName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dayData.record ? (
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-muted-foreground" />
                              <span className="text-foreground">{formatTime(dayData.record.checkInTime)}</span>
                            </div>
                          </div>
                          {dayData.record.checkInImage && (
                            <img 
                              src={dayData.record.checkInImage} 
                              alt="Check-in" 
                              onClick={() => setSelectedImage(dayData.record.checkInImage)}
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer border border-border hover:scale-110 transition-transform"
                            />
                          )}
                        </div>
                      ) : dayData.isFuture ? (
                        <span className="text-muted-foreground opacity-50">N/A</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dayData.record?.checkOutTime ? (
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-muted-foreground" />
                              <span className="text-foreground">{formatTime(dayData.record.checkOutTime)}</span>
                            </div>
                          </div>
                          {dayData.record.checkOutImage && (
                            <img 
                              src={dayData.record.checkOutImage} 
                              alt="Check-out" 
                              onClick={() => setSelectedImage(dayData.record.checkOutImage)}
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer border border-border hover:scale-110 transition-transform"
                            />
                          )}
                        </div>
                      ) : dayData.record ? (
                        <span className="text-muted-foreground ">Not checked out</span>
                      ) : dayData.isFuture ? (
                        <span className="text-muted-foreground opacity-50">N/A</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {dayData.record ? formatHoursToHMS(dayData.record.totalHours || 0) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${getStatusColor(dayData.status)}`}>
                        {dayData.isFuture ? 'N/A' : dayData.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {dayData.record ? (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-muted-foreground mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground text-xs">
                            {dayData.record.checkInLocation?.address
                              ? `${dayData.record.checkInLocation.address.substring(0, 50)}...`
                              : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Attendance"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-card text-foreground rounded-full p-2 hover:bg-muted transition-colors shadow-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
