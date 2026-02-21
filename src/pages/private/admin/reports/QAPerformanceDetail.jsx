import React, { useState, useMemo, useEffect } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import {
  ChevronDown,
  ChevronUp,
  FileDown,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGetAgentPerformanceQuery } from '../../../../features/agentPerformance/agentPerformanceApi';
import { toast } from 'react-toastify';
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subDays,
} from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const QADetailCard = ({ QAData, isDark, onDownloadPDF, handleDownloadExcel }) => {
  const [expanded, setExpanded] = useState(false);

  const agent = QAData.agent;
  
  // Use pre-calculated stats from API
  const queryStats = QAData.queries;
  const ticketStats = QAData.tickets; // Old Ticket model (chat tickets)
  const emailTicketStats = QAData.emailTickets; // Email Tickets (same as QA Dashboard)
  const combinedStats = QAData.combined;

  // Query metrics
  const QAQueries = {
    total: queryStats.total,
    resolved: queryStats.resolved,
    accepted: queryStats.accepted,
    inProgress: queryStats.inProgress,
    pending: queryStats.pending,
    escalated: queryStats.escalated,
    expired: queryStats.expired,
  };

  // Email Ticket metrics (showing Email Tickets - same as QA Dashboard TicketStats)
  const QATickets = {
    total: emailTicketStats.total,
    resolved: emailTicketStats.closed, // EmailTicket uses 'closed' for resolved
    open: emailTicketStats.open,
    inProgress: emailTicketStats.pending, // EmailTicket uses 'pending' for in progress
    escalated: emailTicketStats.escalated || 0, // High priority = escalated
  };

  // Combined metrics
  const resolutionRate = combinedStats.resolutionRate || 0;
  const customerFeedbackRating = combinedStats.customerFeedbackRating || null;
  const totalCustomerRatings = combinedStats.totalCustomerRatings || 0;
  const escalationRate = QATickets.total > 0 
    ? Math.round((QATickets.escalated / QATickets.total) * 100)
    : 0;

  // Status distribution data for chart (Email Ticket statuses)
  const statusDistribution = [
    { name: 'Closed', value: QATickets.resolved, fill: '#10b981' },
    { name: 'Open', value: QATickets.open, fill: '#3b82f6' },
    { name: 'Pending', value: QATickets.inProgress, fill: '#f59e0b' },
    { name: 'Escalated', value: QATickets.escalated, fill: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Prepare Radar Chart Data for Queries
  const maxQueryValue = Math.max(
    QAQueries.total,
    QAQueries.resolved,
    QAQueries.accepted,
    QAQueries.inProgress,
    QAQueries.escalated,
    10
  );
  const queryRadarData = [
    {
      metric: `Total (${QAQueries.total})`,
      value: QAQueries.total,
      actualValue: QAQueries.total,
      fullMark: maxQueryValue,
    },
    {
      metric: `Resolved (${QAQueries.resolved})`,
      value: QAQueries.resolved,
      actualValue: QAQueries.resolved,
      fullMark: maxQueryValue,
    },
    {
      metric: `Accepted (${QAQueries.accepted})`,
      value: QAQueries.accepted,
      actualValue: QAQueries.accepted,
      fullMark: maxQueryValue,
    },
    {
      metric: `In Progress (${QAQueries.inProgress})`,
      value: QAQueries.inProgress,
      actualValue: QAQueries.inProgress,
      fullMark: maxQueryValue,
    },
    {
      metric: `Escalated (${QAQueries.escalated})`,
      value: QAQueries.escalated,
      actualValue: QAQueries.escalated,
      fullMark: maxQueryValue,
    },
  ];

  // Prepare Radar Chart Data for Tickets
  const maxTicketValue = Math.max(
    QATickets.total,
    QATickets.resolved,
    QATickets.open,
    QATickets.inProgress,
    QATickets.escalated,
    10
  );
  const ticketRadarData = [
    {
      metric: `Total (${QATickets.total})`,
      value: QATickets.total,
      actualValue: QATickets.total,
      fullMark: maxTicketValue,
    },
    {
      metric: `Closed (${QATickets.resolved})`,
      value: QATickets.resolved,
      actualValue: QATickets.resolved,
      fullMark: maxTicketValue,
    },
    {
      metric: `Open (${QATickets.open})`,
      value: QATickets.open,
      actualValue: QATickets.open,
      fullMark: maxTicketValue,
    },
    {
      metric: `Pending (${QATickets.inProgress})`,
      value: QATickets.inProgress,
      actualValue: QATickets.inProgress,
      fullMark: maxTicketValue,
    },
    {
      metric: `Escalated (${QATickets.escalated})`,
      value: QATickets.escalated,
      actualValue: QATickets.escalated,
      fullMark: maxTicketValue,
    },
  ];

  return (
    <div className="mb-4 border border-border  rounded-lg overflow-hidden bg-card  shadow-sm">
      {/* Main Row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-2 cursor-pointer hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2 flex-1">
          <Avatar
            src={agent.profileImage}
            alt={agent.name}
            className="w-12 h-12"
            sx={{ bgcolor: '#3b82f6' }}
          >
            {agent.name?.charAt(0)}
          </Avatar>

          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <p className="text-sm text-muted-foreground ">{agent.email}</p>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground ">Tickets</p>
              <p className="text-lg font-bold text-foreground">
                {QATickets.total}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground ">Queries</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {QAQueries.total}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground ">T-Closed</p>
              <p className="text-lg font-bold text-green-600 ">
                {QATickets.resolved}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground ">Q-Resolved</p>
              <p className="text-lg font-bold text-green-600 ">
                {QAQueries.resolved}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground ">T-Pending</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {QATickets.inProgress}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground ">T-Escalated</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {QATickets.escalated}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground ">Q-Escalated</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {QAQueries.escalated}
              </p>
            </div>
            {customerFeedbackRating && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground ">Feedback</p>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {customerFeedbackRating}⭐
                </p>
              </div>
            )}
          </div>
        </div>

        <button className="p-2 hover:bg-muted dark:hover:bg-slate-700 rounded-lg transition-colors">
          {expanded ? (
            <ChevronUp size={20} className="text-muted-foreground " />
          ) : (
            <ChevronDown size={20} className="text-muted-foreground " />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border  p-6 bg-muted/50 /50">
          {/* Download Options */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* PDF Download Dropdown */}
            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 bg-card  border border-border dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer shadow-sm hover:bg-muted/50 dark:hover:bg-slate-700 transition-colors"
                onChange={(e) => {
                  if (e.target.value) {
                    onDownloadPDF(QAData, e.target.value);
                    e.target.value = ''; // Reset
                  }
                }}
                defaultValue=""
                onClick={(e) => e.stopPropagation()}
              >
                <option value="" disabled>
                  Download PDF Report
                </option>
                <option value="daily">Daily PDF</option>
                <option value="weekly">Weekly PDF</option>
                <option value="monthly">Monthly PDF</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <FileDown size={16} className="text-red-500" />
              </div>
            </div>

            {/* Excel Download Dropdown */}
            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 bg-card  border border-border dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer shadow-sm hover:bg-muted/50 dark:hover:bg-slate-700 transition-colors"
                onChange={(e) => {
                  if (e.target.value) {
                    handleDownloadExcel(QAData, e.target.value);
                    e.target.value = ''; // Reset
                  }
                }}
                defaultValue=""
                onClick={(e) => e.stopPropagation()}
              >
                <option value="" disabled>
                  Download Excel Report
                </option>
                <option value="daily">Daily Excel</option>
                <option value="weekly">Weekly Excel</option>
                <option value="monthly">Monthly Excel</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <FileSpreadsheet size={16} className="text-green-600" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground  italic">
              Select a format to download detailed performance report
            </p>
          </div>

          {/* Query Related Statistics */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-primary/20 dark:border-blue-700 p-4 mb-4">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3 uppercase tracking-wide">
              📊 Query Statistics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="bg-card  rounded-lg p-3 border border-blue-100 dark:border-slate-600">
                <p className="text-xs text-muted-foreground  mb-1">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {QAQueries.total}
                </p>
              </div>
              <div className="bg-card  rounded-lg p-3 border border-green-100 dark:border-slate-600">
                <p className="text-xs text-muted-foreground  mb-1">Resolved</p>
                <p className="text-2xl font-bold text-green-600 ">
                  {QAQueries.resolved}
                </p>
              </div>
              <div className="bg-card  rounded-lg p-3 border border-blue-100 dark:border-slate-600">
                <p className="text-xs text-muted-foreground  mb-1">Accepted</p>
                <p className="text-2xl font-bold text-foreground ">{QAQueries.accepted}</p>
              </div>
              <div className="bg-card  rounded-lg p-3 border border-amber-100 dark:border-slate-600">
                <p className="text-xs text-muted-foreground  mb-1">In Progress</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {QAQueries.inProgress}
                </p>
              </div>
              <div className="bg-card  rounded-lg p-3 border border-red-200 dark:border-red-700 shadow-md">
                <p className="text-xs text-muted-foreground  mb-1 font-semibold">
                  Escalated
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {QAQueries.escalated}
                </p>
              </div>
              {QAQueries.expired > 0 && (
                <div className="bg-card  rounded-lg p-3 border border-border  shadow-md">
                  <p className="text-xs text-muted-foreground  mb-1 font-semibold">
                    Expired
                  </p>
                  <p className="text-2xl font-bold text-muted-foreground ">
                    {QAQueries.expired}
                  </p>
                </div>
              )}
              {customerFeedbackRating && (
                <div className="bg-card  rounded-lg p-3 border border-yellow-200 dark:border-yellow-700 shadow-md">
                  <p className="text-xs text-muted-foreground  mb-1 font-semibold">
                    Customer Feedback
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {customerFeedbackRating}⭐
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {totalCustomerRatings} rated
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Email Ticket Statistics (same as QA Dashboard) */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-green-200 dark:border-green-700 p-4 mb-4">
            <h4 className="text-sm font-bold text-green-900 dark:text-green-300 mb-3 uppercase tracking-wide">
              🎫 Ticket Statistics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-card  rounded-lg p-3 border border-green-100 dark:border-slate-600">
                <p className="text-xs text-muted-foreground  mb-1">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {QATickets.total}
                </p>
              </div>
              <div className="bg-card  rounded-lg p-3 border border-blue-100 dark:border-slate-600">
                <p className="text-xs text-muted-foreground  mb-1">Open</p>
                <p className="text-2xl font-bold text-foreground ">{QATickets.open}</p>
              </div>
              <div className="bg-card  rounded-lg p-3 border border-amber-100 dark:border-slate-600">
                <p className="text-xs text-muted-foreground  mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {QATickets.inProgress}
                </p>
              </div>
              <div className="bg-card  rounded-lg p-3 border border-green-100 dark:border-slate-600">
                <p className="text-xs text-muted-foreground  mb-1">Closed</p>
                <p className="text-2xl font-bold text-green-600 ">
                  {QATickets.resolved}
                </p>
              </div>
              <div className="bg-card  rounded-lg p-3 border border-red-200 dark:border-red-700">
                <p className="text-xs text-muted-foreground  mb-1">Escalated</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {QATickets.escalated}
                </p>
                <p className="text-xs text-red-500 dark:text-red-400">{escalationRate}%</p>
              </div>
            </div>
          </div>

          {/* Two Radar Charts Side by Side - Showing Actual Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Query Performance Radar Chart */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-primary/20 dark:border-blue-700 p-6">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 text-center uppercase tracking-wide">
                📊 Query Performance Radar
              </h4>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={queryRadarData}>
                  <PolarGrid stroke="#94a3b8" strokeWidth={1.5} />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: isDark ? '#e2e8f0' : '#1e293b', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 'dataMax']}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  />
                  <Radar
                    name="Queries"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.7}
                    strokeWidth={2}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload[0]) {
                        return (
                          <div className="bg-card  p-3 rounded-lg border-2 border-blue-500 shadow-lg">
                            <p className="font-semibold text-foreground">
                              {payload[0].payload.metric}
                            </p>
                            <p className="text-foreground  font-bold">
                              Value: {payload[0].payload.actualValue}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Ticket Performance Radar Chart */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-green-200 dark:border-green-700 p-6">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4 text-center uppercase tracking-wide">
                🎫 Ticket Performance Radar
              </h4>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={ticketRadarData}>
                  <PolarGrid stroke="#94a3b8" strokeWidth={1.5} />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: isDark ? '#e2e8f0' : '#1e293b', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 'dataMax']}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  />
                  <Radar
                    name="Tickets"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.7}
                    strokeWidth={2}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload[0]) {
                        return (
                          <div className="bg-card  p-3 rounded-lg border-2 border-green-500 shadow-lg">
                            <p className="font-semibold text-foreground">
                              {payload[0].payload.metric}
                            </p>
                            <p className="text-green-600  font-bold">
                              Value: {payload[0].payload.actualValue}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ticket Status Distribution Pie Chart */}
          {statusDistribution.length > 0 && (
            <div className="bg-card  rounded-lg border border-border  p-6">
              <h4 className="font-semibold text-foreground mb-4 text-center">
                Ticket Status Distribution
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const QAPerformanceDetail = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate date range based on selected month/year
  const dateRange = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth));
    const end = endOfMonth(new Date(selectedYear, selectedMonth));
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      role: 'QA'
    };
  }, [selectedMonth, selectedYear]);

  const {
    data: performanceData,
    isLoading: performanceLoading,
    refetch: refetchPerformance,
  } = useGetAgentPerformanceQuery(dateRange);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchPerformance();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Data refreshed successfully!');
  };

  // Performance data is already pre-calculated per QA
  const QAPerformanceList = useMemo(() => {
    if (!performanceData?.data) return [];
    console.log('📊 QA Performance Data:', performanceData.data);
    return performanceData.data;
  }, [performanceData]);

  const filteredQAs = useMemo(() => {
    let filtered = QAPerformanceList.filter(
      (item) =>
        item.agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.agent.name.localeCompare(b.agent.name);
      if (sortBy === 'status') return b.agent.isActive - a.agent.isActive;
      return 0;
    });

    return filtered;
  }, [QAPerformanceList, searchTerm, sortBy]);

  const handleDownloadAllQAsPDF = async (period) => {
    const toastId = toast.loading(`Generating ${period} report for all QAs...`);

    try {
      // Calculate date range
      const now = new Date();
      let startDate, endDate, periodText;

      if (period === 'daily') {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        periodText = format(now, 'MMM dd, yyyy');
      } else if (period === 'weekly') {
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
        periodText = `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
      } else if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        periodText = `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
      }

      // Generate report for all QAs using pre-calculated stats
      let allQAsHTML = '';

      QAPerformanceList.forEach((QAData, index) => {
        const agent = QAData.agent;
        const queryStats = QAData.queries;
        const emailTicketStats = QAData.emailTickets; // Use EmailTickets instead of old Tickets
        const combinedStats = QAData.combined;

        const resolutionRate = combinedStats.resolutionRate || 0;

        allQAsHTML += `
          <div style="page-break-inside: avoid; margin-bottom: 30px; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; background: #ffffff;">
            <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #4F46E5; padding-bottom: 15px;">
              <div style="font-size: 24px; font-weight: bold; color: #9ca3af; margin-right: 20px;">#${
                index + 1
              }</div>
              <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; margin-right: 15px;">
                ${agent.name?.charAt(0) || 'A'}
              </div>
              <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 22px; color: #111827;">${agent.name}</h3>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${agent.email}</p>
              </div>
              <div style="text-align: right;">
                <span style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; ${
                  agent.isActive
                    ? 'background: #d1fae5; color: #065f46;'
                    : 'background: #f3f4f6; color: #6b7280;'
                }">
                  ${agent.isActive ? '🟢 Online' : '⚫ Offline'}
                </span>
              </div>
            </div>
            
            <h4 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">📊 QUERY STATISTICS</h4>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Total</div>
                <div style="font-size: 24px; font-weight: bold;">${queryStats.total}</div>
              </div>
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #84fab0 0%, #10b981 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Resolved</div>
                <div style="font-size: 24px; font-weight: bold;">${queryStats.resolved}</div>
              </div>
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #a8edea 0%, #3b82f6 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Accepted</div>
                <div style="font-size: 24px; font-weight: bold;">${queryStats.accepted}</div>
              </div>
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #ffeaa7 0%, #f59e0b 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">In Progress</div>
                <div style="font-size: 24px; font-weight: bold;">${queryStats.inProgress}</div>
              </div>
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #fbc2eb 0%, #ef4444 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Escalated</div>
                <div style="font-size: 24px; font-weight: bold;">${queryStats.escalated}</div>
              </div>
            </div>
            
            <h4 style="font-size: 16px; font-weight: bold; color: #10b981; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">🎫 TICKET STATISTICS</h4>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Total</div>
                <div style="font-size: 24px; font-weight: bold;">${emailTicketStats.total}</div>
              </div>
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #a8edea 0%, #3b82f6 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Open</div>
                <div style="font-size: 24px; font-weight: bold;">${emailTicketStats.open}</div>
              </div>
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #ffeaa7 0%, #f59e0b 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Pending</div>
                <div style="font-size: 24px; font-weight: bold;">${emailTicketStats.pending}</div>
              </div>
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #84fab0 0%, #10b981 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Closed</div>
                <div style="font-size: 24px; font-weight: bold;">${emailTicketStats.closed}</div>
              </div>
              <div style="text-align: center; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #fbc2eb 0%, #ef4444 100%); color: white;">
                <div style="font-size: 11px; margin-bottom: 4px; opacity: 0.9;">Escalated</div>
                <div style="font-size: 24px; font-weight: bold;">${emailTicketStats.escalated || 0}</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Resolution Rate</div>
                <div style="font-size: 20px; font-weight: bold; color: #10b981;">${resolutionRate}%</div>
              </div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Customer Feedback</div>
                <div style="font-size: 20px; font-weight: bold; color: #eab308;">${combinedStats.customerFeedbackRating || 'N/A'}${combinedStats.customerFeedbackRating ? '⭐' : ''}</div>
                <div style="font-size: 10px; color: #9ca3af;">${combinedStats.totalCustomerRatings || 0} rated</div>
              </div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Status</div>
                <div style="font-size: 16px; font-weight: bold; color: ${
                  agent.isActive ? '#10b981' : '#6b7280'
                };">${agent.isActive ? 'Active' : 'Offline'}</div>
              </div>
            </div>
          </div>
          ${index < QAPerformanceList.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
        `;
      });

      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>all QAs Performance Report - ${period}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8f9fa; }
            .header { text-align: center; border-bottom: 4px solid #4F46E5; padding-bottom: 25px; margin-bottom: 35px; background: white; padding: 40px; border-radius: 12px; }
            .header h1 { color: #4F46E5; margin: 0; font-size: 42px; text-transform: uppercase; letter-spacing: 2px; }
            .header p { margin: 15px 0 0 0; color: #666; font-size: 18px; }
            .summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 35px; text-align: center; }
            .summary h2 { font-size: 28px; margin-bottom: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px; }
            .summary-card { background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; }
            .summary-card .label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
            .summary-card .value { font-size: 32px; font-weight: bold; }
            @media print {
              body { background: white; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 all QAs Performance Report</h1>
            <p><strong>Period:</strong> ${periodText} (${period.toUpperCase()})</p>
            <p><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy hh:mm a')}</p>
            <p><strong>Total QAs:</strong> ${QAPerformanceList.length}</p>
          </div>
          
          <div class="summary">
            <h2>Overall Summary</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="label">Total QAs</div>
                <div class="value">${QAPerformanceList.length}</div>
              </div>
              <div class="summary-card">
                <div class="label">Active QAs</div>
                <div class="value">${QAPerformanceList.filter((item) => item.agent.isActive).length}</div>
              </div>
              <div class="summary-card">
                <div class="label">Total Tickets</div>
                <div class="value">${QAPerformanceList.reduce((sum, item) => sum + item.tickets.total, 0)}</div>
              </div>
              <div class="summary-card">
                <div class="label">Period</div>
                <div class="value" style="font-size: 20px;">${period.toUpperCase()}</div>
              </div>
            </div>
          </div>
          
          ${allQAsHTML}
          
          <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 13px; padding: 20px; border-top: 2px solid #e5e7eb;">
            <p><strong>Report Generated by TL Dashboard</strong></p>
            <p>This is an automated report. For queries, contact your system administrator.</p>
          </div>
        </body>
        </html>
      `;

      // Create and download PDF
      const printWindow = window.open('', '', 'width=900,height=650');
      printWindow.document.write(fullHTML);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        toast.dismiss(toastId);
        toast.success(`all QAs ${period} PDF report generated successfully!`, { autoClose: 3000 });
      }, 500);
    } catch (error) {
      console.error('Error generating all QAs PDF:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate PDF report');
    }
  };

  const handleDownloadAllQAsExcel = async (period) => {
    const toastId = toast.loading(`Generating ${period} Excel report for all QAs...`);

    try {
      // Calculate date range
      const now = new Date();
      let startDate, endDate, dateRangeText;

      if (period === 'daily') {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        dateRangeText = format(now, 'MMM dd, yyyy');
      } else if (period === 'weekly') {
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
        dateRangeText = `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
      } else if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        dateRangeText = `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
      }

      // Prepare data for Excel using pre-calculated stats
      const excelData = QAPerformanceList.map((QAData, index) => {
        const agent = QAData.agent;
        const queryStats = QAData.queries;
        const emailTicketStats = QAData.emailTickets;
        const combinedStats = QAData.combined;

        return {
          'S.No': index + 1,
          'QA Name': agent.name,
          Email: agent.email,
          Status: agent.isActive ? 'Online' : 'Offline',
          // Query Stats
          'Total Queries': queryStats.total,
          'Q-Resolved': queryStats.resolved,
          'Q-Accepted': queryStats.accepted,
          'Q-InProgress': queryStats.inProgress,
          'Q-Escalated': queryStats.escalated,
          // Ticket Stats (Email Tickets)
          'Total Tickets': emailTicketStats.total,
          'T-Open': emailTicketStats.open,
          'T-Pending': emailTicketStats.pending,
          'T-Closed': emailTicketStats.closed,
          'T-Escalated': emailTicketStats.escalated || 0,
          'Customer Feedback': combinedStats.customerFeedbackRating || 'N/A',
          'Feedback Count': combinedStats.totalCustomerRatings || 0,
        };
      });

      if (excelData.length === 0) {
        toast.error('No data available for the selected period', { id: toastId });
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'QAs Performance');

      // Generate file - use writeFile (browser-compatible)
      XLSX.writeFile(
        wb,
        `All_QAs_Performance_${period}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        { bookType: 'xlsx', type: 'binary' }
      );

      toast.dismiss(toastId);
      toast.success(`all QAs ${period} Excel report downloaded successfully!`, { autoClose: 3000 });
    } catch (error) {
      console.error('Error generating all QAs Excel:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate Excel report');
    }
  };

  const handleDownloadExcel = async (QAData, period) => {
    const agent = QAData.agent;
    const toastId = toast.loading(`Generating ${period} Excel report for ${agent.name}...`);

    try {
      // Calculate date range
      const now = new Date();
      let startDate, endDate, dateRangeText;

      if (period === 'daily') {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        dateRangeText = format(now, 'dd MMM yyyy');
      } else if (period === 'weekly') {
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
        dateRangeText = `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`; 
      } else if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        dateRangeText = `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;
      }

      // Use pre-calculated stats from QAData
      const queryStats = QAData.queries;
      const emailTicketStats = QAData.emailTickets;
      const combinedStats = QAData.combined;

      // Prepare data for Excel with both Query and Ticket stats
      const excelData = [
        {
          'Report Type': 'QA Performance Summary',
          'QA Name': agent.name,
          'QA Email': agent.email,
          'Report Period': period.toUpperCase(),
          'Date Range': dateRangeText,
          'Generated On': format(now, 'dd MMM yyyy, hh:mm a'),
        },
        {},
        { 'TICKET STATISTICS': '' },
        { 'Metric': 'Total Tickets', 'Value': emailTicketStats.total },
        { 'Metric': 'Open Tickets', 'Value': emailTicketStats.open },
        { 'Metric': 'Pending Tickets', 'Value': emailTicketStats.pending },
        { 'Metric': 'Closed Tickets', 'Value': emailTicketStats.closed },
        { 'Metric': 'Escalated Tickets', 'Value': emailTicketStats.escalated || 0 },
        {},
        { 'QUERY STATISTICS': '' },
        { 'Metric': 'Total Queries', 'Value': queryStats.total },
        { 'Metric': 'Resolved Queries', 'Value': queryStats.resolved },
        { 'Metric': 'Accepted Queries', 'Value': queryStats.accepted },
        { 'Metric': 'In Progress Queries', 'Value': queryStats.inProgress },
        { 'Metric': 'Escalated Queries', 'Value': queryStats.escalated },
        {},
        { 'COMBINED STATISTICS': '' },
        { 'Metric': 'Total Resolved Items', 'Value': combinedStats.totalResolved },
        { 'Metric': 'Total Items Handled', 'Value': combinedStats.totalItems },
        { 'Metric': 'Customer Feedback Rating', 'Value': combinedStats.customerFeedbackRating || 'N/A' },
        { 'Metric': 'Total Customer Ratings', 'Value': combinedStats.totalCustomerRatings || 0 },
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      ws['!cols'] = [{ wch: 30 }, { wch: 50 }];

      XLSX.utils.book_append_sheet(wb, ws, 'QA Performance');

      // Generate file - browser-compatible
      XLSX.writeFile(
        wb,
        `${agent.name.replace(/\s+/g, '_')}_Performance_${period}_${format(
          new Date(),
          'yyyy-MM-dd'
        )}.xlsx`,
        { bookType: 'xlsx', type: 'binary' }
      );

      toast.dismiss(toastId);
      toast.success(`${agent.name} - ${period} Excel report downloaded successfully!`, { autoClose: 3000 });
    } catch (error) {
      console.error('Error generating QA Excel:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate Excel report');
    }
  };

  const handleDownloadPDF = async (QAData, period) => {
    const agent = QAData.agent;
    const toastId = toast.loading(`Generating ${period} PDF report for ${agent.name}...`);

    try {
      // Calculate date range
      const now = new Date();
      let startDate, endDate, dateRangeText, reportTypeText;

      if (period === 'daily') {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        dateRangeText = format(now, 'dd MMM yyyy');
        reportTypeText = 'Daily Performance Report';
      } else if (period === 'weekly') {
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
        dateRangeText = `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;
        reportTypeText = 'Weekly Performance Report (Last 7 Days)';
      } else if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        dateRangeText = `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;
        reportTypeText = 'Monthly Performance Report';
      }

      // Use pre-calculated stats from QAData
      const queryStats = QAData.queries;
      const emailTicketStats = QAData.emailTickets;
      const combinedStats = QAData.combined;

      const resolutionRate = combinedStats.resolutionRate || 0;

      // Generate PDF HTML
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>QA Performance Report - ${period}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
            .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 25px; margin-bottom: 35px; }
            .header h1 { color: #4F46E5; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 15px 0 0 0; color: #666; font-size: 16px; }
            .QA-info { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; }
            .QA-info h2 { font-size: 28px; margin-bottom: 10px; }
            .QA-info p { font-size: 16px; opacity: 0.95; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
            .info-table td { padding: 14px 0; font-size: 15px; border-bottom: 1px solid #e5e7eb; }
            .info-table td:first-child { font-weight: bold; color: #374151; text-transform: uppercase; font-size: 14px; }
            .info-table td:last-child { color: #1F2937; font-size: 16px; font-weight: 600; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 35px; }
            .metric-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 5px solid #3b82f6; padding: 20px; border-radius: 8px; }
            .metric-card.green { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981; }
            .metric-card.orange { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left-color: #f59e0b; }
            .metric-card.purple { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left-color: #a855f7; }
            .metric-card h3 { color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600; }
            .metric-card p { font-size: 32px; font-weight: bold; color: #1f2937; }
            .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin: 35px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px; }
            .performance-summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .performance-summary p { margin: 10px 0; color: #374151; font-size: 15px; line-height: 1.8; }
            .performance-summary strong { color: #1f2937; font-weight: 600; }
            .footer { margin-top: 50px; padding-top: 25px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
            .footer p { margin: 0; font-weight: 500; }
            .footer p:last-child { margin-top: 8px; font-size: 12px; }
            .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-left: 10px; }
            .badge.daily { background: #dbeafe; color: #1e40af; }
            .badge.monthly { background: #fce7f3; color: #9f1239; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QA Performance Report</h1>
              <p>Comprehensive Performance Analysis - ${
                period.charAt(0).toUpperCase() + period.slice(1)
              } Report <span class="badge ${period}">${period.toUpperCase()}</span></p>
            </div>

            <div class="QA-info">
              <h2>${agent.name}</h2>
              <p>${agent.email} | Employee ID: ${agent.employee_id || 'N/A'}</p>
            </div>

            <table class="info-table">
              <tr>
                <td>Report Period:</td>
                <td>${dateRangeText}</td>
              </tr>
              <tr>
                <td>Generated On:</td>
                <td>${format(now, 'dd MMM yyyy, hh:mm a')}</td>
              </tr>
              <tr>
                <td>Report Type:</td>
                <td>${reportTypeText}</td>
              </tr>
              <tr>
                <td>QA Status:</td>
                <td>${agent.isActive ? '🟢 Online' : '🔴 Offline'}</td>
              </tr>
            </table>

            <h2 class="section-title">Ticket Performance Metrics</h2>
            <div class="metrics">
              <div class="metric-card">
                <h3>Total Tickets</h3>
                <p>${emailTicketStats.total}</p>
              </div>
              <div class="metric-card green">
                <h3>Closed Tickets</h3>
                <p>${emailTicketStats.closed}</p>
              </div>
              <div class="metric-card orange">
                <h3>Pending Tickets</h3>
                <p>${emailTicketStats.pending || 0}</p>
              </div>
              <div class="metric-card purple">
                <h3>Escalated Tickets</h3>
                <p>${emailTicketStats.escalated || 0}</p>
              </div>
            </div>

            <h2 class="section-title">Query Performance Metrics</h2>
            <div class="metrics">
              <div class="metric-card">
                <h3>Total Queries</h3>
                <p>${queryStats.total}</p>
              </div>
              <div class="metric-card green">
                <h3>Resolved Queries</h3>
                <p>${queryStats.resolved}</p>
              </div>
              <div class="metric-card purple">
                <h3>In Progress Queries</h3>
                <p>${queryStats.inProgress}</p>
              </div>
              <div class="metric-card orange">
                <h3>Escalated Queries</h3>
                <p>${queryStats.escalated || 0}</p>
              </div>
            </div>

            <h2 class="section-title">Performance Summary</h2>
            <div class="performance-summary">
              <p><strong>Ticket Handling:</strong> Processed ${emailTicketStats.total} tickets during this ${period} period. (Open: ${emailTicketStats.open}, Pending: ${emailTicketStats.pending || 0}, Closed: ${emailTicketStats.closed}, Escalated: ${emailTicketStats.escalated || 0})</p>
              <p><strong>Query Handling:</strong> Handled ${queryStats.total} queries during this ${period} period. (Resolved: ${queryStats.resolved}, In Progress: ${queryStats.inProgress}, Escalated: ${queryStats.escalated || 0})</p>
              <p><strong>Resolution Efficiency:</strong> Successfully closed ${emailTicketStats.closed} tickets and resolved ${queryStats.resolved} queries with a ${resolutionRate}% overall resolution rate.</p>
              <p><strong>Escalated Items:</strong> ${emailTicketStats.escalated || 0} tickets and ${queryStats.escalated || 0} queries were escalated.</p>
              ${combinedStats.customerFeedbackRating ? `<p><strong>Customer Feedback:</strong> Average rating of ${combinedStats.customerFeedbackRating}⭐ from ${combinedStats.totalCustomerRatings} customer reviews.</p>` : ''}
              <p><strong>Performance Status:</strong> ${
                resolutionRate >= 80
                  ? '✅ Excellent Performance'
                  : resolutionRate >= 60
                  ? '⚠️ Good Performance'
                  : '❌ Needs Improvement'
              }</p>
            </div>

            <div class="footer">
              <p>Report Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}</p>
              <p>© ${new Date().getFullYear()} CRM System - Professional Performance Report (TL Panel)</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([pdfHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agent.name.replace(/\s+/g, '_')}_${period}_report_${format(
        now,
        'yyyy-MM-dd'
      )}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: `${
          period.charAt(0).toUpperCase() + period.slice(1)
        } report downloaded successfully!`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.update(toastId, {
        render: `Failed to generate ${period} report`,
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  if (performanceLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-foreground " />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              QA Performance Reports
            </h1>
            <p className="text-muted-foreground ">
              View detailed performance metrics and download daily or monthly reports
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Download all QAs Reports */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-purple-200 dark:border-purple-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-1">
                📥 Download all QAs Performance Reports
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Generate comprehensive PDF reports for all {QAPerformanceList.length} QAs
              </p>
            </div>
            <div className="flex gap-3">
              {/* PDF Dropdown */}
              <div className="relative">
                <select
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-purple-300 dark:border-purple-600 bg-card  text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent font-medium shadow-sm cursor-pointer"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      handleDownloadAllQAsPDF(value);
                      setTimeout(() => {
                        e.target.value = '';
                      }, 100);
                    }
                  }}
                  value=""
                >
                  <option value="" disabled>
                    PDF Reports
                  </option>
                  <option value="daily">Daily PDF</option>
                  <option value="weekly">Weekly PDF</option>
                  <option value="monthly">Monthly PDF</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-red-500">
                  <FileDown size={16} />
                </div>
              </div>

              {/* Excel Dropdown */}
              <div className="relative">
                <select
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-purple-300 dark:border-purple-600 bg-card  text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-medium shadow-sm cursor-pointer"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      handleDownloadAllQAsExcel(value);
                      setTimeout(() => {
                        e.target.value = '';
                      }, 100);
                    }
                  }}
                  value=""
                >
                  <option value="" disabled>
                    Excel Reports
                  </option>
                  <option value="daily">Daily Excel</option>
                  <option value="weekly">Weekly Excel</option>
                  <option value="monthly">Monthly Excel</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-green-600">
                  <FileSpreadsheet size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Month Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📅 Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-border dark:border-slate-600 
                bg-card  text-foreground
                focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="0">January</option>
              <option value="1">February</option>
              <option value="2">March</option>
              <option value="3">April</option>
              <option value="4">May</option>
              <option value="5">June</option>
              <option value="6">July</option>
              <option value="7">August</option>
              <option value="8">September</option>
              <option value="9">October</option>
              <option value="10">November</option>
              <option value="11">December</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📆 Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-border dark:border-slate-600 
                bg-card  text-foreground
                focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-border dark:border-slate-600 
              bg-card  text-foreground
              focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-transparent"
          />
          
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border dark:border-slate-600 
              bg-card  text-foreground
              focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-6 rounded-lg bg-card  border border-border ">
          <p className="text-sm text-muted-foreground ">Total QAs</p>
          <h3 className="text-3xl font-bold text-foreground  mt-1">
            {QAPerformanceList.length}
          </h3>
        </div>
        <div className="p-6 rounded-lg bg-card  border border-border ">
          <p className="text-sm text-muted-foreground ">Currently Active</p>
          <h3 className="text-3xl font-bold text-green-600  mt-1">
            {QAPerformanceList.filter((item) => item.agent.isActive).length}
          </h3>
        </div>
        <div className="p-6 rounded-lg bg-card  border border-border ">
          <p className="text-sm text-muted-foreground ">Offline</p>
          <h3 className="text-3xl font-bold text-muted-foreground  mt-1">
            {QAPerformanceList.filter((item) => !item.agent.isActive).length}
          </h3>
        </div>
      </div>

      {/* QAs List */}
      <div className="space-y-4">
        {filteredQAs.map((QAData) => (
          <QADetailCard
            key={QAData.agent._id}
            QAData={QAData}
            isDark={isDark}
            onDownloadPDF={handleDownloadPDF}
            handleDownloadExcel={handleDownloadExcel}
          />
        ))}
      </div>

      {filteredQAs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground ">
          No QAs found matching your search.
        </div>
      )}
    </div>
  );
};

export default QAPerformanceDetail;
