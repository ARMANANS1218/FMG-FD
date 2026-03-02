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

const QAActivity = () => {
  const { data: employeesData, isLoading, refetch } = useGetAllEmployeesQuery();
  const [filterDate, setFilterDate] = useState('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedQAId, setExpandedQAId] = useState(null);
  const [qaHistory, setQAHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  // Break Details Modal state
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [selectedBreakQA, setSelectedBreakQA] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Data refreshed successfully!');
  };

  // Filter to show only QA members
  const qaMembers = employeesData?.data?.filter((emp) => emp.role === 'QA') || [];

  // Fetch 30-day history for a QA member
  const fetch30DayHistory = async (qaId) => {
    if (qaHistory[qaId]) {
      setExpandedQAId(expandedQAId === qaId ? null : qaId);
      return;
    }

    setLoadingHistory((prev) => ({ ...prev, [qaId]: true }));

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${qaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status && result.data) {
        setQAHistory((prev) => ({ ...prev, [qaId]: result.data }));
        setExpandedQAId(qaId);
      } else {
        toast.error('Failed to load activity history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading activity history');
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [qaId]: false }));
    }
  };

  const handleRowClick = (qaId) => {
    if (expandedQAId === qaId) {
      setExpandedQAId(null);
    } else {
      fetch30DayHistory(qaId);
    }
  };

  // Calculate real activity data from actual login/logout times and break logs
  const qaWithActivity = qaMembers.map((qa) => {
    const loginTime = qa.login_time ? new Date(qa.login_time) : null;
    const logoutTimeRaw = qa.logout_time ? new Date(qa.logout_time) : null;
    const now = new Date();

    let totalBreakDuration = 0;
    let totalBreaks = 0;
    if (qa.breakLogs && qa.breakLogs.length > 0) {
      totalBreaks = qa.breakLogs.length;
      totalBreakDuration = qa.breakLogs.reduce((total, log) => {
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
    } else if (qa.is_active) {
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
      ...qa,
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

  // Download individual QA Excel
  const handleDownloadQAExcel = async (qa, period) => {
    const toastId = toast.loading(`Generating ${qa.name}'s ${period} report...`);

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

      // Fetch QA's daily history from API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${qa._id}`, {
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
        ['QA Activity Report'],
        ['Generated On', format(now, 'dd MMM yyyy, hh:mm a')],
        ['Period', periodLabel],
        [''],
        ['QA Details'],
        ['Name', qa.name],
        ['Employee ID', qa.employee_id],
        ['Email', qa.email],
        ['Role', qa.role],
        [
          'Current Status',
          qa.isBlocked
            ? 'Blocked'
            : qa.is_active
              ? qa.workStatus === 'break'
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
          formatTime(qa.activity.loginTime),
          formatTime(qa.activity.logoutTime),
          formatDuration(qa.activity.activeTime),
          qa.activity.totalBreaks,
          formatDuration(qa.activity.breakDuration),
        ]);
        totalOnlineTime = qa.activity.activeTime || 0;
        totalBreakTime = qa.activity.breakDuration || 0;
        totalBreakCount = qa.activity.totalBreaks || 0;
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

      XLSX.utils.book_append_sheet(wb, ws, 'QA Report');
      XLSX.writeFile(wb, `${qa.name.replace(/\s+/g, '_')}_${period}_report.xlsx`);

      toast.dismiss(toastId);
      toast.success(`${qa.name}'s ${period} report generated!`);
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate Excel report');
    }
  };

  // Excel Report Generation (All QA)
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
      `Generating ${period === 'custom' ? `${monthNames[customMonth - 1]} ${customYear}` : period} QA activity report...`
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
        ['QA Activity Report'],
        ['Generated On', format(now, 'dd MMM yyyy, hh:mm a')],
        ['Period', periodLabel],
        [''],
        ['Summary'],
        [
          'QA Member',
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

      const qaRows = qaWithActivity.map((qa) => [
        qa.name,
        qa.employee_id,
        qa.email,
        qa.activity.logoutTime
          ? 'Offline'
          : qa.is_active
            ? qa.workStatus === 'break'
              ? 'On Break'
              : 'Active'
            : 'Offline',
        formatTime(qa.activity.loginTime),
        formatTime(qa.activity.logoutTime),
        formatDuration(qa.activity.activeTime),
        qa.activity.totalBreaks,
        formatDuration(qa.activity.breakDuration),
      ]);

      const totalOnlineTime = qaWithActivity.reduce((acc, qa) => acc + qa.activity.activeTime, 0);
      const totalBreakTime = qaWithActivity.reduce((acc, qa) => acc + qa.activity.breakDuration, 0);
      const totalBreaks = qaWithActivity.reduce((acc, qa) => acc + qa.activity.totalBreaks, 0);

      const summaryData = [
        [''],
        ['Overall Summary'],
        ['Total QA Members', qaMembers.length],
        ['Currently Active', qaMembers.filter((q) => q.is_active).length],
        ['On Break', qaMembers.filter((q) => q.workStatus === 'break').length],
        ['Offline', qaMembers.filter((q) => !q.is_active).length],
        ['Total Online Time', formatDuration(totalOnlineTime)],
        ['Total Break Time', formatDuration(totalBreakTime)],
        ['Total Breaks', totalBreaks],
        [
          'Average Active Time per QA',
          formatDuration(Math.round(totalOnlineTime / (qaMembers.length || 1))),
        ],
      ];

      const allData = [...headerData, ...qaRows, ...summaryData];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(allData);

      XLSX.utils.book_append_sheet(wb, ws, 'QA Report');

      const fileName = `QA_Activity_${period === 'custom' ? `${monthNames[customMonth - 1]}_${customYear}` : period}_${format(now, 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.dismiss(toastId);
      toast.success(`QA ${period} report generated!`);
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
          <h1 className="text-4xl font-bold text-foreground mb-2">QA Activity</h1>
          <p className="text-muted-foreground">
            Track QA member work hours, breaks, and activity status
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
                {qaMembers.filter((q) => q.is_active).length}
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
                {qaMembers.filter((q) => q.workStatus === 'break').length}
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
                {qaMembers.filter((q) => !q.is_active).length}
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
                  qaWithActivity.reduce((acc, q) => acc + q.activity.activeTime, 0) /
                  qaMembers.length || 0
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
                  QA Member
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
              {qaWithActivity.map((qa) => (
                <React.Fragment key={qa._id}>
                  <tr className="hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={qa.profileImage}
                          alt={qa.name}
                          className="w-10 h-10 bg-amber-500"
                        >
                          {qa.name.charAt(0)}
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{qa.name}</p>
                          <p className="text-sm text-muted-foreground">{qa.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${qa.activity.logoutTime
                          ? 'bg-muted text-gray-800  '
                          : qa.is_active
                            ? qa.workStatus === 'break'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 '
                            : 'bg-muted text-gray-800  '
                          }`}
                      >
                        {qa.activity.logoutTime
                          ? 'Offline'
                          : qa.is_active
                            ? qa.workStatus === 'break'
                              ? 'On Break'
                              : 'Active'
                            : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Login fontSize="small" className="text-green-600 " />
                        {formatTime(qa.activity.loginTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Logout fontSize="small" className="text-red-600 dark:text-red-400" />
                        {formatTime(qa.activity.logoutTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground ">
                      {formatDuration(qa.activity.activeTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground text-center">
                      {qa.activity.totalBreaks}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400 italic">
                        {qa.workStatus === 'break' ? (qa.breakReason || 'Break') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
                      <div className="flex items-center gap-2">
                        {formatDuration(qa.activity.breakDuration)}
                        {qa.activity.totalBreaks > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBreakQA(qa);
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
                            handleDownloadQAExcel(qa, 'daily');
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title="Download Daily Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadQAExcel(qa, 'weekly');
                          }}
                          className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                          title="Download Weekly Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadQAExcel(qa, 'monthly');
                          }}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Download Monthly Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(qa._id);
                          }}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          title="View 30-Day History"
                        >
                          {expandedQAId === qa._id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Section */}
                  {expandedQAId === qa._id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-6 bg-muted/50">
                        {loadingHistory[qa._id] ? (
                          <div className="flex justify-center py-8">
                            <CircularProgress size={40} />
                          </div>
                        ) : qaHistory[qa._id] ? (
                          <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                              Last 30 Days Activity - {qa.name}
                            </h3>

                            {/* Chart */}
                            <div className="bg-card  p-6 rounded-lg border border-border ">
                              <Line
                                data={{
                                  labels: qaHistory[qa._id]
                                    .map((day) => format(new Date(day.date), 'MMM dd'))
                                    .reverse(),
                                  datasets: [
                                    {
                                      label: 'Online Time (minutes)',
                                      data: qaHistory[qa._id]
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
          setSelectedBreakQA(null);
        }}
        employeeData={selectedBreakQA}
      />
    </div>
  );
};

export default QAActivity;
