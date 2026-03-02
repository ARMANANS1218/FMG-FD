import React, { useState } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import { AccessTime, Login, Logout, Coffee, Work } from '@mui/icons-material';
import { RefreshCw, FileSpreadsheet, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';
import BreakDetailsModal from '../../../../components/common/BreakDetailsModal';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TLActivity = () => {
  const { data: employeesData, isLoading, refetch } = useGetAllEmployeesQuery();
  const [filterDate, setFilterDate] = useState('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedTLId, setExpandedTLId] = useState(null);
  const [tlHistory, setTLHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  // Break Details Modal state
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [selectedBreakTL, setSelectedBreakTL] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Data refreshed successfully!');
  };

  // Filter to show only TL members
  const tlMembers = employeesData?.data?.filter((emp) => emp.role === 'TL') || [];

  // Fetch 30-day history for a TL member
  const fetch30DayHistory = async (tlId) => {
    if (tlHistory[tlId]) {
      setExpandedTLId(expandedTLId === tlId ? null : tlId);
      return;
    }

    setLoadingHistory((prev) => ({ ...prev, [tlId]: true }));

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${tlId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status && result.data) {
        setTLHistory((prev) => ({ ...prev, [tlId]: result.data }));
        setExpandedTLId(tlId);
      } else {
        toast.error('Failed to load activity history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading activity history');
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [tlId]: false }));
    }
  };

  const handleRowClick = (tlId) => {
    if (expandedTLId === tlId) {
      setExpandedTLId(null);
    } else {
      fetch30DayHistory(tlId);
    }
  };

  // Calculate real activity data from actual login/logout times and break logs
  const tlWithActivity = tlMembers.map((tl) => {
    const loginTime = tl.login_time ? new Date(tl.login_time) : null;
    const logoutTimeRaw = tl.logout_time ? new Date(tl.logout_time) : null;
    const now = new Date();

    let totalBreakDuration = 0;
    let totalBreaks = 0;
    if (tl.breakLogs && tl.breakLogs.length > 0) {
      totalBreaks = tl.breakLogs.length;
      totalBreakDuration = tl.breakLogs.reduce((total, log) => {
        if (log.duration) {
          return total + log.duration;
        }
        return total;
      }, 0);
    }

    let logoutTime = null;
    let activeTime = 0;

    if (!loginTime) {
      logoutTime = null;
      activeTime = 0;
    } else if (tl.is_active) {
      logoutTime = null;
      const totalTimeInMs = now - loginTime;
      const totalTimeInMinutes = totalTimeInMs / 60000;
      activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
    } else if (logoutTimeRaw) {
      logoutTime = logoutTimeRaw;
      const totalTimeInMs = logoutTimeRaw - loginTime;
      const totalTimeInMinutes = totalTimeInMs / 60000;
      activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
    } else {
      logoutTime = null;
      activeTime = 0;
    }

    return {
      ...tl,
      activity: {
        loginTime: loginTime,
        logoutTime: logoutTime,
        totalBreaks: totalBreaks,
        breakDuration: totalBreakDuration,
        activeTime: activeTime,
        idleTime: 0,
      },
    };
  });

  const formatTime = (date) => {
    if (!date) return '-';
    return format(date, 'hh:mm a');
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes < 0) return '00:00:00';
    const totalSeconds = Math.round(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Download individual TL Excel
  const handleDownloadTLExcel = async (tl, period) => {
    const toastId = toast.loading(`Generating ${tl.name}'s ${period} report...`);

    try {
      const now = new Date();
      let periodLabel;
      let daysToShow = 1;

      if (period === 'daily') {
        periodLabel = format(now, 'MMMM dd, yyyy');
      } else if (period === 'weekly') {
        daysToShow = 7;
        periodLabel = `Last 7 Days (${format(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), 'MMM dd')} - ${format(now, 'MMM dd, yyyy')})`;
      } else if (period === 'monthly') {
        daysToShow = now.getDate();
        periodLabel = `${format(now, 'MMMM yyyy')} (Day 1 - Day ${now.getDate()})`;
      }

      // Fetch TL's daily history from API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${tl._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      const dailyActivities = result.status && result.data ? result.data : [];

      const activityMap = {};
      dailyActivities.forEach((act) => {
        const dateKey = format(new Date(act.date), 'yyyy-MM-dd');
        activityMap[dateKey] = act;
      });

      let totalOnlineTime = 0;
      let totalBreakTime = 0;
      let totalBreakCount = 0;

      const headerData = [
        ['Team Lead Activity Report'],
        ['Generated On', format(now, 'dd MMM yyyy, hh:mm a')],
        ['Period', periodLabel],
        [''],
        ['Team Lead Details'],
        ['Name', tl.name],
        ['Employee ID', tl.employee_id],
        ['Email', tl.email],
        ['Role', tl.role],
        [
          'Current Status',
          tl.isBlocked
            ? 'Blocked'
            : tl.is_active
              ? tl.workStatus === 'break'
                ? 'On Break'
                : 'Active'
              : 'Offline',
        ],
        [''],
        ['Day-by-Day Activity'],
        ['Date', 'Login Time', 'Logout Time', 'Online Time', 'Breaks', 'Break Duration'],
      ];

      const dailyRows = [];

      if (period === 'daily') {
        dailyRows.push([
          format(now, 'MMM dd, yyyy'),
          formatTime(tl.activity.loginTime),
          formatTime(tl.activity.logoutTime),
          formatDuration(tl.activity.activeTime),
          tl.activity.totalBreaks,
          formatDuration(tl.activity.breakDuration),
        ]);
        totalOnlineTime = tl.activity.activeTime || 0;
        totalBreakTime = tl.activity.breakDuration || 0;
        totalBreakCount = tl.activity.totalBreaks || 0;
      } else {
        let daysWithData = 0;
        for (let i = 0; i < daysToShow; i++) {
          const targetDate = new Date(now);
          if (period === 'monthly') {
            targetDate.setDate(i + 1);
          } else {
            targetDate.setDate(now.getDate() - (daysToShow - 1 - i));
          }

          const dateKey = format(targetDate, 'yyyy-MM-dd');
          const activity = activityMap[dateKey];

          if (activity) {
            dailyRows.push([
              format(targetDate, 'MMM dd, yyyy'),
              activity.loginTime ? format(new Date(activity.loginTime), 'hh:mm a') : 'N/A',
              activity.logoutTime ? format(new Date(activity.logoutTime), 'hh:mm a') : 'N/A',
              formatDuration(activity.totalOnlineTime || 0),
              activity.breakCount || 0,
              formatDuration(activity.totalBreakTime || 0),
            ]);
            totalOnlineTime += activity.totalOnlineTime || 0;
            totalBreakTime += activity.totalBreakTime || 0;
            totalBreakCount += activity.breakCount || 0;
            daysWithData++;
          } else {
            dailyRows.push([format(targetDate, 'MMM dd, yyyy'), 'N/A', 'N/A', '0m', 0, '0m']);
          }
        }
      }

      const summaryData = [
        [''],
        ['Summary'],
        ['Total Days with Data', dailyActivities.length || 1],
        ['Total Online Time', formatDuration(totalOnlineTime)],
        ['Total Break Time', formatDuration(totalBreakTime)],
        ['Total Breaks', totalBreakCount],
        [
          'Average Daily Online',
          formatDuration(Math.round(totalOnlineTime / (dailyActivities.length || 1))),
        ],
      ];

      const allData = [...headerData, ...dailyRows, ...summaryData];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(allData);

      XLSX.utils.book_append_sheet(wb, ws, 'TL Report');
      XLSX.writeFile(wb, `${tl.name.replace(/\s+/g, '_')}_${period}_report.xlsx`);

      toast.dismiss(toastId);
      toast.success(`${tl.name}'s ${period} report generated!`);
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate Excel report');
    }
  };

  // Excel Report Generation (All TL)
  const handleDownloadExcel = async (period, customMonth = null, customYear = null) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const toastId = toast.loading(
      `Generating ${period === 'custom' ? `${monthNames[customMonth - 1]} ${customYear}` : period} TL activity report...`
    );

    try {
      const now = new Date();
      let periodLabel;

      if (period === 'daily') {
        periodLabel = format(now, 'MMMM dd, yyyy');
      } else if (period === 'weekly') {
        periodLabel = `Week ending ${format(now, 'MMMM dd, yyyy')}`;
      } else if (period === 'monthly') {
        periodLabel = `Last 30 Days ending ${format(now, 'MMMM dd, yyyy')}`;
      } else if (period === 'custom') {
        periodLabel = `${monthNames[customMonth - 1]} ${customYear}`;
      }

      const headerData = [
        ['Team Lead Activity Report'],
        ['Generated On', format(now, 'dd MMM yyyy, hh:mm a')],
        ['Period', periodLabel],
        [''],
        ['Summary'],
        [
          'Team Lead',
          'Employee ID',
          'Email',
          'Status',
          'Login Time',
          'Logout Time',
          'Active Time',
          'Total Breaks',
          'Break Duration',
        ],
      ];

      const tlRows = tlWithActivity.map((tl) => [
        tl.name,
        tl.employee_id,
        tl.email,
        tl.activity.logoutTime
          ? 'Offline'
          : tl.is_active
            ? tl.workStatus === 'break'
              ? 'On Break'
              : 'Active'
            : 'Offline',
        formatTime(tl.activity.loginTime),
        formatTime(tl.activity.logoutTime),
        formatDuration(tl.activity.activeTime),
        tl.activity.totalBreaks,
        formatDuration(tl.activity.breakDuration),
      ]);

      const totalOnlineTime = tlWithActivity.reduce((acc, tl) => acc + tl.activity.activeTime, 0);
      const totalBreakTime = tlWithActivity.reduce((acc, tl) => acc + tl.activity.breakDuration, 0);
      const totalBreaks = tlWithActivity.reduce((acc, tl) => acc + tl.activity.totalBreaks, 0);

      const summaryData = [
        [''],
        ['Overall Summary'],
        ['Total Team Leads', tlMembers.length],
        ['Currently Active', tlMembers.filter((t) => t.is_active).length],
        ['On Break', tlMembers.filter((t) => t.workStatus === 'break').length],
        ['Offline', tlMembers.filter((t) => !t.is_active).length],
        ['Total Online Time', formatDuration(totalOnlineTime)],
        ['Total Break Time', formatDuration(totalBreakTime)],
        ['Total Breaks', totalBreaks],
        [
          'Average Active Time per TL',
          formatDuration(Math.round(totalOnlineTime / (tlMembers.length || 1))),
        ],
      ];

      const allData = [...headerData, ...tlRows, ...summaryData];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(allData);

      XLSX.utils.book_append_sheet(wb, ws, 'TL Report');

      const fileName = `TL_Activity_${period === 'custom' ? `${monthNames[customMonth - 1]}_${customYear}` : period}_${format(now, 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.dismiss(toastId);
      toast.success(`TL ${period} report generated!`);
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate Excel report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-amber-600 dark:text-amber-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">TL Activity</h1>
          <p className="text-muted-foreground">
            Track Team Leader work hours, breaks, and activity status
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => handleDownloadExcel('daily')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileSpreadsheet size={16} />
            Daily
          </button>
          <button
            onClick={() => handleDownloadExcel('weekly')}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileSpreadsheet size={16} />
            Weekly
          </button>
          <button
            onClick={() => handleDownloadExcel('monthly')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileSpreadsheet size={16} />
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Month Filter */}
      <div className="mb-6 flex items-center gap-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
        >
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
            (month, idx) => (
              <option key={idx} value={idx + 1}>
                {month}
              </option>
            )
          )}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
        >
          {[2024, 2025, 2026].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <button
          onClick={() => handleDownloadExcel('custom', selectedMonth, selectedYear)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Calendar size={16} />
          Download Selected Month
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Currently Active</p>
              <h3 className="text-3xl font-bold text-green-600  mt-1">
                {tlMembers.filter((t) => t.is_active).length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Work className="text-green-600 " fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">On Break</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {tlMembers.filter((t) => t.workStatus === 'break').length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Coffee className="text-amber-600 dark:text-amber-400" fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <h3 className="text-3xl font-bold text-muted-foreground  mt-1">
                {tlMembers.filter((t) => !t.is_active).length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-muted ">
              <Logout className="text-muted-foreground " fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Active Time</p>
              <h3 className="text-3xl font-bold text-foreground  mt-1">
                {formatDuration(
                  tlWithActivity.reduce((acc, t) => acc + t.activity.activeTime, 0) /
                  tlMembers.length || 0
                )}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <AccessTime className="text-foreground " fontSize="large" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded-lg bg-card  border border-border  shadow-sm overflow-hidden">
        <div className="p-2 border-b border-border ">
          <h2 className="text-xl font-semibold text-foreground">Activity Details</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50  border-b border-border dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  TL Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Login Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Logout Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Active Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Breaks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Break Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Break Duration
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {tlWithActivity.map((tl) => (
                <React.Fragment key={tl._id}>
                  <tr className="hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={tl.profileImage}
                          alt={tl.name}
                          className="w-10 h-10 bg-amber-500"
                        >
                          {tl.name.charAt(0)}
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{tl.name}</p>
                          <p className="text-sm text-muted-foreground">{tl.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${tl.activity.logoutTime
                          ? 'bg-muted text-gray-800  '
                          : tl.is_active
                            ? tl.workStatus === 'break'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 '
                            : 'bg-muted text-gray-800  '
                          }`}
                      >
                        {tl.activity.logoutTime
                          ? 'Offline'
                          : tl.is_active
                            ? tl.workStatus === 'break'
                              ? 'On Break'
                              : 'Active'
                            : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Login fontSize="small" className="text-green-600 " />
                        {formatTime(tl.activity.loginTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Logout fontSize="small" className="text-red-600 dark:text-red-400" />
                        {formatTime(tl.activity.logoutTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground ">
                      {formatDuration(tl.activity.activeTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground text-center">
                      {tl.activity.totalBreaks}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400 italic">
                        {tl.workStatus === 'break' ? (tl.breakReason || 'Break') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
                      <div className="flex items-center gap-2">
                        {formatDuration(tl.activity.breakDuration)}
                        {tl.activity.totalBreaks > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBreakTL(tl);
                              setIsBreakModalOpen(true);
                            }}
                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-full transition-colors"
                            title="View Break Details"
                          >
                            <Coffee fontSize="small" className="text-amber-600 dark:text-amber-400" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadTLExcel(tl, 'daily');
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title="Download Daily Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadTLExcel(tl, 'weekly');
                          }}
                          className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                          title="Download Weekly Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadTLExcel(tl, 'monthly');
                          }}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Download Monthly Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(tl._id);
                          }}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          title="View 30-Day History"
                        >
                          {expandedTLId === tl._id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Section */}
                  {expandedTLId === tl._id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-6 bg-muted/50">
                        {loadingHistory[tl._id] ? (
                          <div className="flex justify-center py-8">
                            <CircularProgress size={40} />
                          </div>
                        ) : tlHistory[tl._id] ? (
                          <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                              Last 30 Days Activity - {tl.name}
                            </h3>

                            {/* Chart */}
                            <div className="bg-card  p-6 rounded-lg border border-border ">
                              <Line
                                data={{
                                  labels: tlHistory[tl._id]
                                    .map((day) => format(new Date(day.date), 'MMM dd'))
                                    .reverse(),
                                  datasets: [
                                    {
                                      label: 'Online Time (minutes)',
                                      data: tlHistory[tl._id]
                                        .map((day) => day.totalOnlineTime)
                                        .reverse(),
                                      borderColor: 'rgb(59, 130, 246)',
                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                      tension: 0.4,
                                      fill: true,
                                      pointRadius: 4,
                                      pointHoverRadius: 6,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false,
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function (context) {
                                          const minutes = context.parsed.y;
                                          const hours = Math.floor(minutes / 60);
                                          const mins = Math.round(minutes % 60);
                                          return `Online Time: ${hours}h ${mins}m`;
                                        },
                                      },
                                    },
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        callback: function (value) {
                                          const hours = Math.floor(value / 60);
                                          return `${hours}h`;
                                        },
                                      },
                                    },
                                  },
                                }}
                                height={300}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground">No data available</p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Break Details Modal */}
      <BreakDetailsModal
        isOpen={isBreakModalOpen}
        onClose={() => {
          setIsBreakModalOpen(false);
          setSelectedBreakTL(null);
        }}
        employeeData={selectedBreakTL}
      />
    </div>
  );
};

export default TLActivity;
