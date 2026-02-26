import React, { useState, useEffect } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Briefcase,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
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

const AgentActivity = () => {
  const { data: employeesData, isLoading, refetch } = useGetAllEmployeesQuery();
  // Get start of today for filtering
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [agentHistory, setAgentHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  // Month picker state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Data refreshed successfully!');
  };

  const agents = employeesData?.data?.filter((emp) => emp.role === 'Agent') || [];

  // Fetch 30-day history for an agent
  const fetch30DayHistory = async (agentId) => {
    if (agentHistory[agentId]) {
      // Already loaded, just toggle expand
      setExpandedAgentId(expandedAgentId === agentId ? null : agentId);
      return;
    }

    setLoadingHistory((prev) => ({ ...prev, [agentId]: true }));

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:6010';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${agentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status && result.data) {
        setAgentHistory((prev) => ({ ...prev, [agentId]: result.data }));
        setExpandedAgentId(agentId);
      } else {
        toast.error('Failed to load activity history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading activity history');
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const handleRowClick = (agentId) => {
    if (expandedAgentId === agentId) {
      setExpandedAgentId(null);
    } else {
      fetch30DayHistory(agentId);
    }
  };

  // Calculate real activity data from agent data
  const agentsWithActivity = agents.map((agent) => {
    const loginTime = agent.login_time ? new Date(agent.login_time) : null;
    const logoutTimeRaw = agent.logout_time ? new Date(agent.logout_time) : null;
    const now = new Date();

    // Calculate total break duration in minutes (ONLY from breakLogs, NOT including checkout)
    let totalBreakDuration = 0;
    let totalBreaks = 0;
    if (agent.breakLogs && agent.breakLogs.length > 0) {
      totalBreaks = agent.breakLogs.length;
      totalBreakDuration = agent.breakLogs.reduce((total, log) => {
        if (log.duration) {
          return total + log.duration;
        }
        return total;
      }, 0);
    }

    // Determine logout time and calculate active time
    let logoutTime = null;
    let activeTime = 0;

    if (!loginTime) {
      // No login time available - agent never logged in today
      logoutTime = null;
      activeTime = 0;
    } else if (agent.is_active) {
      // Agent is currently ONLINE (active or on break)
      // Calculate time from login to now
      logoutTime = null; // Show "-" since they haven't logged out yet
      const totalTimeInMs = now - loginTime;
      const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);

      // Subtract break time to get active time
      activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
    } else {
      // Agent is OFFLINE (logged out or checked out)
      // Use logout_time as the end time
      if (logoutTimeRaw && logoutTimeRaw > loginTime) {
        logoutTime = logoutTimeRaw;
        const totalTimeInMs = logoutTime - loginTime;
        const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);

        // Subtract break time to get active time (breaks are NOT counted in online time)
        activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
      } else {
        // No valid logout_time - treat current time as logout
        logoutTime = now;
        const totalTimeInMs = now - loginTime;
        const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);
        activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
      }
    }

    return {
      ...agent,
      activity: {
        loginTime,
        logoutTime,
        totalBreaks,
        breakDuration: totalBreakDuration,
        activeTime,
      },
    };
  });

  const formatTime = (date) => {
    if (!date) return 'N/A';
    try {
      return format(date, 'hh:mm a');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${mins}m`;
  };

  // Download individual agent Excel
  const handleDownloadAgentExcel = async (agent, period) => {
    const toastId = toast.loading(`Generating ${agent.name}'s ${period} report...`);

    try {
      const now = new Date();
      let periodLabel;
      let daysToShow = 1;

      if (period === 'daily') {
        periodLabel = format(now, 'MMMM dd, yyyy');
      } else if (period === 'weekly') {
        // Last 7 days including today
        daysToShow = 7;
        periodLabel = `Last 7 Days (${format(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), 'MMM dd')} - ${format(now, 'MMM dd, yyyy')})`;
      } else if (period === 'monthly') {
        // Current calendar month (from 1st to today)
        daysToShow = now.getDate(); // e.g., 17 for Jan 17
        periodLabel = `${format(now, 'MMMM yyyy')} (Day 1 - Day ${now.getDate()})`;
      }

      // Fetch agent's daily history from API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${agent._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      // Get the daily activities
      const dailyActivities = result.status && result.data ? result.data : [];

      // Create a map for quick lookup by date string
      const activityMap = {};
      dailyActivities.forEach((act) => {
        const dateKey = format(new Date(act.date), 'yyyy-MM-dd');
        activityMap[dateKey] = act;
      });

      // Calculate totals
      let totalOnlineTime = 0;
      let totalBreakTime = 0;
      let totalBreakCount = 0;

      // Prepare header info
      const headerData = [
        ['Agent Activity Report'],
        ['Generated On', format(now, 'dd MMM yyyy, hh:mm a')],
        ['Period', periodLabel],
        [''],
        ['Agent Details'],
        ['Name', agent.name],
        ['Employee ID', agent.employee_id],
        ['Email', agent.email],
        ['Role', agent.role],
        [
          'Current Status',
          agent.isBlocked
            ? 'Blocked'
            : agent.is_active
              ? agent.workStatus === 'break'
                ? 'On Break'
                : 'Online'
              : 'Offline',
        ],
        [''],
        ['Day-by-Day Activity'],
        ['Date', 'Login Time', 'Logout Time', 'Online Time', 'Breaks', 'Break Duration'],
      ];

      // Prepare daily rows
      const dailyRows = [];

      if (period === 'daily') {
        // For daily, just use current data
        dailyRows.push([
          format(now, 'MMM dd, yyyy'),
          formatTime(agent.activity.loginTime),
          formatTime(agent.activity.logoutTime),
          formatDuration(agent.activity.activeTime),
          agent.activity.totalBreaks,
          formatDuration(agent.activity.breakDuration),
        ]);
        totalOnlineTime = agent.activity.activeTime || 0;
        totalBreakTime = agent.activity.breakDuration || 0;
        totalBreakCount = agent.activity.totalBreaks || 0;
      } else {
        // For weekly/monthly, generate all dates and fill from history
        let daysWithData = 0;
        for (let i = 0; i < daysToShow; i++) {
          const targetDate = new Date(now);
          if (period === 'monthly') {
            // For monthly: start from 1st of month, go up to today
            targetDate.setDate(i + 1);
          } else {
            // For weekly: last 7 days (today, yesterday, etc.)
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

      // Summary row
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

      // Combine all data
      const allData = [...headerData, ...dailyRows, ...summaryData];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(allData);

      // Style the first column (keys)
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
        if (!ws[cellRef]) continue;
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.font = { bold: true };
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Agent Report');

      // Save file
      XLSX.writeFile(wb, `${agent.name.replace(/\s+/g, '_')}_${period}_report.xlsx`);

      toast.dismiss(toastId);
      toast.success(`${agent.name}'s ${period} report generated!`);
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate Excel report');
    }
  };

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
      `Generating ${period === 'custom' ? `${monthNames[customMonth - 1]} ${customYear}` : period} activity report...`
    );

    try {
      const now = new Date();
      let periodLabel;
      let dataToExport = [];

      if (period === 'daily') {
        // Daily uses current data from state
        periodLabel = format(now, 'MMMM dd, yyyy');
        dataToExport = agentsWithActivity.map((agent) => ({
          name: agent.name,
          email: agent.email,
          employee_id: agent.employee_id,
          isBlocked: agent.isBlocked,
          is_active: agent.is_active,
          workStatus: agent.workStatus,
          loginTime: agent.activity.loginTime,
          logoutTime: agent.activity.logoutTime,
          totalOnlineTime: agent.activity.activeTime,
          totalBreakTime: agent.activity.breakDuration,
          totalBreakCount: agent.activity.totalBreaks,
          daysWorked: 1,
        }));
      } else {
        // Weekly/Monthly/Custom fetches real historical data from API
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
        const token = localStorage.getItem('token');

        let url = `${API_URL}/api/v1/user/activity/report?period=${period}`;
        if (period === 'custom' && customMonth && customYear) {
          url = `${API_URL}/api/v1/user/activity/report?month=${customMonth}&year=${customYear}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!result.status) {
          throw new Error(result.message || 'Failed to fetch report data');
        }

        const startDate = new Date(result.data.startDate);
        const endDate = new Date(result.data.endDate);
        periodLabel =
          period === 'custom'
            ? `${monthNames[customMonth - 1]} ${customYear}`
            : `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
        dataToExport = result.data.agents;
      }

      // Filter out blocked agents for summary calculations
      const activeData = dataToExport.filter((a) => !a.isBlocked);
      const totalAgents = activeData.length;
      const avgOnlineTime =
        totalAgents > 0
          ? Math.round(
              activeData.reduce((acc, a) => acc + (a.totalOnlineTime || 0), 0) / totalAgents
            )
          : 0;

      // Prepare summary data
      const summaryData = [
        [''],
        ['Agent Activity Report'],
        ['Period', periodLabel],
        ['Generated On', format(now, 'dd MMM yyyy, hh:mm a')],
        ['Type', `${period.charAt(0).toUpperCase() + period.slice(1)} Activity Report`],
        [''],
        ['Summary'],
        ['Total Agents', totalAgents],
        ['Avg Online Time', formatDuration(avgOnlineTime)],
      ];

      // For daily, show simple one-row-per-agent format
      if (period === 'daily') {
        const headers = [
          'S.No',
          'Agent Name',
          'Email',
          'Status',
          'Login Time',
          'Logout Time',
          'Online Time',
          'Breaks',
          'Break Duration',
        ];

        const agentRows = dataToExport.map((agent, index) => [
          index + 1,
          agent.name,
          agent.email,
          agent.isBlocked
            ? 'Blocked'
            : agent.is_active
              ? agent.workStatus === 'break'
                ? 'On Break'
                : 'Online'
              : 'Offline',
          agent.loginTime ? format(new Date(agent.loginTime), 'hh:mm a') : 'N/A',
          agent.logoutTime ? format(new Date(agent.logoutTime), 'hh:mm a') : 'N/A',
          formatDuration(agent.totalOnlineTime || 0),
          agent.totalBreakCount || 0,
          formatDuration(agent.totalBreakTime || 0),
        ]);

        const wsData = [headers, ...agentRows, ...summaryData];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Activity Report');
        XLSX.writeFile(wb, `Agent_Activity_${period}_${format(now, 'yyyy-MM-dd')}.xlsx`);
      } else {
        // For weekly/monthly/custom, show day-by-day breakdown per agent
        const allRows = [];

        // Day-by-day headers
        const dayHeaders = [
          'Date',
          'Login Time',
          'Logout Time',
          'Online Time',
          'Breaks',
          'Break Duration',
        ];

        // Determine date range
        let daysToShow;
        let startDate;
        if (period === 'weekly') {
          daysToShow = 7;
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 6);
        } else if (period === 'monthly') {
          daysToShow = now.getDate();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'custom') {
          const customDate = new Date(customYear, customMonth - 1, 1);
          startDate = customDate;
          const isCurrentMonth =
            customMonth === now.getMonth() + 1 && customYear === now.getFullYear();
          if (isCurrentMonth) {
            daysToShow = now.getDate();
          } else {
            const lastDay = new Date(customYear, customMonth, 0);
            daysToShow = lastDay.getDate();
          }
        }

        // Build rows for each agent
        for (const agent of dataToExport) {
          allRows.push([]);
          allRows.push([
            `Agent: ${agent.name}`,
            `Email: ${agent.email}`,
            `Employee ID: ${agent.employee_id || 'N/A'}`,
          ]);
          allRows.push(dayHeaders);

          const activityMap = {};
          if (agent.dailyActivities) {
            agent.dailyActivities.forEach((act) => {
              const dateKey = format(new Date(act.date), 'yyyy-MM-dd');
              activityMap[dateKey] = act;
            });
          }

          let agentTotalOnline = 0;
          let agentTotalBreaks = 0;
          let agentDaysWithData = 0;

          for (let i = 0; i < daysToShow; i++) {
            const targetDate = new Date(startDate);
            if (period === 'monthly') {
              targetDate.setDate(i + 1);
            } else if (period === 'weekly') {
              targetDate.setDate(startDate.getDate() + i);
            } else if (period === 'custom') {
              targetDate.setDate(i + 1);
            }

            const dateKey = format(targetDate, 'yyyy-MM-dd');
            const activity = activityMap[dateKey];

            if (activity) {
              allRows.push([
                format(targetDate, 'MMM dd, yyyy'),
                activity.loginTime ? format(new Date(activity.loginTime), 'hh:mm a') : 'N/A',
                activity.logoutTime ? format(new Date(activity.logoutTime), 'hh:mm a') : 'N/A',
                formatDuration(activity.onlineTime || activity.totalOnlineTime || 0),
                activity.breakCount || 0,
                formatDuration(activity.breakTime || activity.totalBreakTime || 0),
              ]);
              agentTotalOnline += activity.onlineTime || activity.totalOnlineTime || 0;
              agentTotalBreaks += activity.breakCount || 0;
              agentDaysWithData++;
            } else {
              allRows.push([format(targetDate, 'MMM dd, yyyy'), 'N/A', 'N/A', '0m', 0, '0m']);
            }
          }

          allRows.push(['Total', '', '', formatDuration(agentTotalOnline), agentTotalBreaks, '']);
          allRows.push([
            'Days with Data',
            agentDaysWithData,
            'Avg Daily',
            formatDuration(
              agentDaysWithData > 0 ? Math.round(agentTotalOnline / agentDaysWithData) : 0
            ),
            '',
            '',
          ]);
        }

        const finalData = [...summaryData, [''], ['Detailed Day-by-Day Report'], ...allRows];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(finalData);
        XLSX.utils.book_append_sheet(wb, ws, 'Activity Report');
        XLSX.writeFile(wb, `Agent_Activity_${period}_${format(now, 'yyyy-MM-dd')}.xlsx`);
      }

      toast.dismiss(toastId);
      toast.success(
        `${period.charAt(0).toUpperCase() + period.slice(1)} activity report generated!`
      );
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.dismiss(toastId);
      toast.error(`Failed to generate ${period} report`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-foreground " />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Agent Activity</h1>
          <p className="text-muted-foreground ">
            Track agent work hours, breaks, and activity status
          </p>
        </div>

        <div className="flex gap-3">
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
          className="px-3 py-2 rounded-lg border border-border dark:border-slate-600 bg-card  text-foreground"
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
          className="px-3 py-2 rounded-lg border border-border dark:border-slate-600 bg-card  text-foreground"
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
              <p className="text-sm text-muted-foreground ">Currently Online</p>
              <h3 className="text-3xl font-bold text-green-600  mt-1">
                {agents.filter((a) => a.is_active).length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Briefcase className="text-green-600 " size={32} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground ">On Break</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {agents.filter((a) => a.workStatus === 'break').length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Coffee className="text-amber-600 dark:text-amber-400" size={32} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground ">Offline</p>
              <h3 className="text-3xl font-bold text-muted-foreground  mt-1">
                {agents.filter((a) => !a.is_active).length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-muted ">
              <LogOut className="text-muted-foreground " size={32} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground ">Avg Online Time (Today)</p>
              <h3 className="text-3xl font-bold text-foreground  mt-1">
                {formatDuration(
                  Math.round(
                    (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const todayAgents = agentsWithActivity.filter((a) => {
                        if (a.isBlocked) return false; // Exclude blocked agents
                        if (!a.activity.loginTime) return false;
                        const loginDate = new Date(a.activity.loginTime);
                        return loginDate >= today;
                      });
                      if (todayAgents.length === 0) return 0;
                      return (
                        todayAgents.reduce((acc, a) => acc + a.activity.activeTime, 0) /
                        todayAgents.length
                      );
                    })()
                  ) || 0
                )}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Clock className="text-foreground " size={32} />
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
                  Agent
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
                  Online Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Breaks
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
              {agentsWithActivity.map((agent) => (
                <React.Fragment key={agent._id}>
                  <tr className="hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={agent.profileImage}
                          alt={agent.name}
                          className="w-10 h-10 bg-card0"
                        >
                          {agent.name.charAt(0)}
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{agent.name}</p>
                          <p className="text-sm text-muted-foreground ">
                            {agent.employee_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          agent.isBlocked
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : agent.is_active
                              ? agent.workStatus === 'break'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 '
                              : 'bg-muted text-gray-800  '
                        }`}
                      >
                        {agent.isBlocked
                          ? 'Blocked'
                          : agent.is_active
                            ? agent.workStatus === 'break'
                              ? 'On Break'
                              : 'Online'
                            : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <LogIn size={16} className="text-green-600 " />
                        {formatTime(agent.activity.loginTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <LogOut size={16} className="text-red-600 dark:text-red-400" />
                        {formatTime(agent.activity.logoutTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground ">
                      {formatDuration(agent.activity.activeTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground text-center">
                      {agent.activity.totalBreaks}
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
                      {formatDuration(agent.activity.breakDuration)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAgentExcel(agent, 'daily');
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title="Download Daily Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAgentExcel(agent, 'weekly');
                          }}
                          className="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                          title="Download Weekly Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAgentExcel(agent, 'monthly');
                          }}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Download Monthly Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(agent._id);
                          }}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          title="View 30-Day History"
                        >
                          {expandedAgentId === agent._id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Section */}
                  {expandedAgentId === agent._id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-6 bg-muted/50 /50">
                        {loadingHistory[agent._id] ? (
                          <div className="flex justify-center py-8">
                            <CircularProgress size={40} />
                          </div>
                        ) : agentHistory[agent._id] ? (
                          <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                              Last 30 Days Activity - {agent.name}
                            </h3>

                            {/* Chart */}
                            <div className="bg-card  p-6 rounded-lg border border-border ">
                              <Line
                                data={{
                                  labels: agentHistory[agent._id]
                                    .map((day) => format(new Date(day.date), 'MMM dd'))
                                    .reverse(),
                                  datasets: [
                                    {
                                      label: 'Online Time (minutes)',
                                      data: agentHistory[agent._id]
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
                                      grid: {
                                        color: 'rgba(148, 163, 184, 0.1)',
                                      },
                                    },
                                    x: {
                                      grid: {
                                        color: 'rgba(148, 163, 184, 0.1)',
                                      },
                                    },
                                  },
                                }}
                                height={300}
                              />
                            </div>

                            {/* Daily Details Table */}
                            <div className="bg-card  rounded-lg border border-border  overflow-hidden">
                              <div className="overflow-x-auto max-h-96">
                                <table className="w-full">
                                  <thead className="bg-muted/50  sticky top-0">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Date
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Login
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Logout
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Online Time
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Breaks
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Break Time
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {agentHistory[agent._id].map((day, idx) => (
                                      <tr
                                        key={idx}
                                        className="hover:bg-muted/50 dark:hover:bg-slate-700/50"
                                      >
                                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                                          {format(new Date(day.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground ">
                                          {day.loginTime
                                            ? format(new Date(day.loginTime), 'hh:mm a')
                                            : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground ">
                                          {day.logoutTime
                                            ? format(new Date(day.logoutTime), 'hh:mm a')
                                            : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-foreground ">
                                          {formatDuration(day.totalOnlineTime)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground  text-center">
                                          {day.breakCount}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
                                          {formatDuration(day.totalBreakTime)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground ">
                            No historical data available
                          </div>
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
    </div>
  );
};

export default AgentActivity;
