import React, { useMemo, useContext, useState } from 'react';
import { CircularProgress } from '@mui/material';
import {
  Users,
  Wifi,
  MessageCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  HelpCircle,
  Zap,
  AlertCircle,
  Send,
  Activity,
  Building2,
  Mail,
  AlertTriangle,
  Info,
  UserCheck,
  Target,
  Award,
  TrendingDown,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import {
  useGetAdminDashboardStatsQuery,
  useGetAllEmployeesQuery,
  useGetAdminFeedbackQuery,
} from '../../../features/admin/adminApi';
import { useGetTicketStatsQuery } from '../../../features/emailTicket/emailTicketApi';
import { useNavigate } from 'react-router-dom';
import ColorModeContext from '../../../context/ColorModeContext';
import { jwtDecode } from 'jwt-decode';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

const COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, trend }) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-xl shadow-sm border border-border flex flex-col transition-all duration-200 
      ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95' : 'cursor-default'}
      bg-card backdrop-blur-sm group`}
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <h4 className="text-2xl font-bold mt-1 text-foreground tracking-tight">{value}</h4>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={20} className={color.replace('bg-', 'text-').replace('/10', '')} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1.5 text-xs font-medium pt-2 border-t border-border/50">
        <TrendingUp size={14} className={trend > 0 ? 'text-emerald-500' : 'text-red-500'} />
        <span className={trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-muted-foreground">from last month</span>
      </div>
    )}
  </div>
);

const ChartContainer = ({ title, children }) => (
  <div className="bg-card rounded-xl p-6 shadow-sm border border-border backdrop-blur-sm hover:shadow-md transition-shadow duration-200">
    <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
      <div className="p-2 rounded-lg bg-card text-foreground">
        <BarChart3 size={18} />
      </div>
      {title}
    </h3>
    {children}
  </div>
);

// Gauge Component for CSAT/Score metrics
const GaugeCard = ({ title, value, max = 100, color = 'blue', subtitle }) => {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;

  const getColor = () => {
    if (percentage >= 80) return { main: '#10b981', light: '#d1fae5', dark: '#064e3b' }; // emerald-500
    if (percentage >= 60) return { main: '#f59e0b', light: '#fef3c7', dark: '#78350f' }; // amber-500
    return { main: '#ef4444', light: '#fee2e2', dark: '#7f1d1d' }; // red-500
  };

  const colors = getColor();

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="relative flex items-center justify-center py-2">
        <div className="relative w-40 h-20 overflow-hidden">
          {/* Background arc */}
          <div className="absolute inset-0 flex items-end justify-center">
            <div className="w-36 h-18 border-[12px] border-muted rounded-t-full"></div>
          </div>
          {/* Progress arc */}
          <div
            className="absolute inset-0 flex items-end justify-center transition-all duration-1000 ease-out"
            style={{
              clipPath: `polygon(0 100%, 100% 100%, 100% 0, ${50 + percentage / 2}% 0, ${
                50 - percentage / 2
              }% 0, 0 0)`,
            }}
          >
            <div
              className="w-36 h-18 border-[12px] rounded-t-full transition-all duration-1000 ease-out"
              style={{ borderColor: colors.main }}
            ></div>
          </div>
          {/* Needle */}
          <div className="absolute inset-0 flex items-end justify-center">
            <div
              className="absolute bottom-0 w-1 h-16 origin-bottom transition-all duration-1000 ease-out"
              style={{
                background: `linear-gradient(to top, ${colors.main}, transparent)`,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-card  shadow-sm border border-border"></div>
            </div>
            <div
              className="absolute bottom-0 w-3 h-3 rounded-full bg-card border-2"
              style={{ borderColor: colors.main }}
            ></div>
          </div>
        </div>
      </div>
      <div className="text-center mt-2">
        <div className="text-3xl font-bold tracking-tight" style={{ color: colors.main }}>
          {value}%
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        )}
      </div>
      <div className="flex justify-between mt-4 text-xs font-medium text-muted-foreground px-4">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

// Time metric card
const TimeMetricCard = ({ label, value, unit }) => (
  <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-200 group">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 rounded-lg bg-card text-foreground group-hover:bg-primary group-hover:text-foreground-foreground transition-colors duration-200">
        <Clock size={16} />
      </div>
      <h3 className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</h3>
    </div>
    <div className="flex items-baseline gap-1.5">
      <div className="text-4xl font-bold text-foreground tracking-tight">{value}</div>
      <div className="text-lg font-medium text-muted-foreground">{unit}</div>
    </div>
    <div className="text-xs text-muted-foreground/80 mt-2 flex items-center gap-1">
      <CheckCircle size={12} className="text-emerald-500" />
      <span>Avg response time</span>
    </div>
  </div>
);

// Ticket count card with alert
const TicketCountCard = ({ value, label, showAlert }) => (
  <div className="relative bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-200 overflow-hidden group">
    {showAlert && (
      <div className="absolute top-0 right-0 p-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </div>
    )}
    <div className="text-5xl font-bold text-foreground mb-2 tracking-tight group-hover:scale-105 transition-transform duration-200 origin-left">{value}</div>
    <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</div>
    <div className="absolute -bottom-6 -right-6 text-foreground/5 rotate-12 group-hover:rotate-0 transition-transform duration-500">
       <AlertCircle size={100} />
    </div>
  </div>
);

// Top performers list
const TopPerformersList = ({ title, data, scoreKey = 'score' }) => (
  <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
    <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
      <Award className="text-amber-500" size={18} />
      {title}
    </h3>
    <div className="space-y-4">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
        >
          <span className="text-gray-700 dark:text-gray-200 font-medium">{item.name}</span>
          <span className="text-foreground font-bold text-lg">{item[scoreKey]}</span>
        </div>
      ))}
    </div>
  </div>
);

// Status bar chart
const StatusBarChart = ({ title, data }) => (
  <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
    <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground font-medium">{item.name}</span>
            <span className="text-foreground font-bold">{item.value}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / Math.max(...data.map((d) => d.value))) * 100}%`,
                backgroundColor: item.color || 'hsl(var(--primary))',
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Agent scores list
const AgentScoresList = ({ title, data }) => (
  <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
    <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <span className="text-foreground min-w-[120px] truncate" title={item.name}>{item.name}</span>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="w-24 bg-secondary rounded-full h-2">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${item.score}%` }}
              ></div>
            </div>
            <span className="text-foreground font-bold w-12 text-right">
              {item.score}%
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';
  const [activeTab, setActiveTab] = useState('agents');
  const [dateFilter, setDateFilter] = useState('week'); // today, week, month, all

  // Get organization name from token/localStorage
  const [organizationName, setOrganizationName] = React.useState('');

  React.useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        // If organization info is in token, use it
        if (decoded.organizationName) {
          setOrganizationName(decoded.organizationName);
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  const {
    data: adminStatsData,
    isLoading: statsLoading,
    refetch: refetchAdminStats,
  } = useGetAdminDashboardStatsQuery(dateFilter);
  const { data: employeesData, isLoading: employeesLoading } = useGetAllEmployeesQuery();
  const {
    data: ticketStatsData,
    isLoading: ticketStatsLoading,
    refetch: refetchTicketStats,
  } = useGetTicketStatsQuery(dateFilter);
  const {
    data: feedbackData,
    isLoading: feedbackLoading,
    refetch: refetchFeedback,
  } = useGetAdminFeedbackQuery(dateFilter);

  const statsData = adminStatsData?.data || {};
  const feedbackStats = feedbackData?.data || {};

  // Extract data from admin stats
  const agentStats = statsData.agent || {};
  const qaStats = statsData.qa || {};
  const overallStats = statsData.overall || {};
  const systemHealth = statsData.systemHealth || {};

  // Calculate actual activity status counts from topAgents array
  const actualActivityCounts = useMemo(() => {
    if (!agentStats.topAgents || agentStats.topAgents.length === 0) {
      return {
        currentlyActive: 0,
        onBreak: 0,
        offline: 0,
        totalAgents: 0,
      };
    }

    const active = agentStats.topAgents.filter(
      (agent) => agent.status === 'active' || agent.status === 'busy'
    ).length;
    const onBreak = agentStats.topAgents.filter((agent) => agent.status === 'break').length;
    const offline = agentStats.topAgents.filter(
      (agent) => agent.status === 'offline' || !agent.status
    ).length;

    return {
      currentlyActive: active,
      onBreak: onBreak,
      offline: offline,
      totalAgents: agentStats.topAgents.length,
    };
  }, [agentStats.topAgents]);

  // Prepare chart data
  const teamDistributionData = useMemo(
    () => [
      { name: 'Agents', value: systemHealth.agentCount || 0, fill: '#6366f1' },
      { name: 'QA', value: systemHealth.qaCount || 0, fill: '#f59e0b' },
      { name: 'Customers', value: systemHealth.customerCount || 0, fill: '#8b5cf6' },
    ],
    [systemHealth]
  );

  const queryStatusData = useMemo(
    () => [
      { name: 'Open', value: overallStats.openQueries || 0, fill: '#3b82f6' },
      { name: 'Resolved', value: overallStats.resolvedQueries || 0, fill: '#10b981' },
    ],
    [overallStats]
  );

  const agentActivityData = useMemo(
    () => [
      { name: 'Active', value: systemHealth.activeAgents || 0, fill: '#10b981' },
      {
        name: 'Inactive',
        value: (systemHealth.agentCount || 0) - (systemHealth.activeAgents || 0),
        fill: '#6b7280',
      },
    ],
    [systemHealth]
  );

  const qaActivityData = useMemo(
    () => [
      { name: 'Active', value: systemHealth.activeQA || 0, fill: '#f59e0b' },
      {
        name: 'Inactive',
        value: (systemHealth.qaCount || 0) - (systemHealth.activeQA || 0),
        fill: '#6b7280',
      },
    ],
    [systemHealth]
  );

  const userAvailabilityData = useMemo(
    () => [
      { name: 'Online', value: systemHealth.activeUsers || 0, fill: '#10b981' },
      { name: 'Offline', value: systemHealth.inactiveUsers || 0, fill: '#6b7280' },
    ],
    [systemHealth]
  );

  const communicationData = useMemo(
    () => [
      { name: 'Chats', value: overallStats.totalChats || 0, fill: '#6366f1' },
      { name: 'Calls', value: overallStats.totalCalls || 0, fill: '#f59e0b' },
    ],
    [overallStats]
  );

  const chartColors = isDark
    ? { line: '#60a5fa', grid: '#334155', text: '#e2e8f0' }
    : { line: '#3b82f6', grid: '#e5e7eb', text: '#374151' };

  const ticketStats = ticketStatsData?.data || {};
  const ticketData = ticketStats.ticketStats || {};
  const priorityStats = ticketStats.priorityStats || {};
  const agentStatsTicket = ticketStats.agentStats || {};

  // Refresh handlers with separate loading states
  const [isRefreshingAgent, setIsRefreshingAgent] = React.useState(false);
  const [isRefreshingQuery, setIsRefreshingQuery] = React.useState(false);
  const [isRefreshingTicket, setIsRefreshingTicket] = React.useState(false);
  const [isRefreshingFeedback, setIsRefreshingFeedback] = React.useState(false);

  const handleRefreshAgentStats = async () => {
    setIsRefreshingAgent(true);
    await refetchAdminStats();
    setTimeout(() => setIsRefreshingAgent(false), 500);
  };

  const handleRefreshQueryStats = async () => {
    setIsRefreshingQuery(true);
    await refetchAdminStats();
    setTimeout(() => setIsRefreshingQuery(false), 500);
  };

  const handleRefreshTicketStats = async () => {
    setIsRefreshingTicket(true);
    await refetchTicketStats();
    setTimeout(() => setIsRefreshingTicket(false), 500);
  };

  const handleRefreshFeedback = async () => {
    setIsRefreshingFeedback(true);
    await refetchFeedback();
    setTimeout(() => setIsRefreshingFeedback(false), 500);
  };

  // Prepare real data for top performers from API only
  const topAgentSolvers = useMemo(
    () =>
      agentStats.topAgents?.slice(0, 8).map((agent) => ({
        name: agent.name || agent.alias || 'Unknown',
        count: agent.resolvedToday || agent.totalResolved || 0,
      })) || [],
    [agentStats.topAgents]
  );

  const agentScoresData = useMemo(
    () =>
      agentStats.topAgents?.slice(0, 9).map((agent) => ({
        name: agent.name || agent.alias || 'Unknown',
        score: agent.successRate || agent.approvalRate || 0,
      })) || [],
    [agentStats.topAgents]
  );

  // Ticket volume data for 7 days from actual API data
  const ticketVolumeData = useMemo(() => {
    if (ticketStats.dailyTrend && ticketStats.dailyTrend.length > 0) {
      return ticketStats.dailyTrend.map((day) => ({
        day: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: day.count || 0,
      }));
    }
    return [];
  }, [ticketStats.dailyTrend]);

  return (
    <div className="p-4 md:p-6 space-y-6 w-full mx-auto min-h-screen">
      {/* Header - Moved to Navbar */}
      {/* Organization Badge if needed */}

      {/* Tabs */}
      <div className="border-b border-border">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {['agents', 'queries', 'tickets', 'feedback', 'agents-list'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap flex items-center gap-2
                  ${activeTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-lg'
                  }
                `}
              >
                {tab === 'agents' && <Users size={16} />}
                {tab === 'queries' && <MessageCircle size={16} />}
                {tab === 'tickets' && <Mail size={16} />}
                {tab === 'feedback' && <Award size={16} />}
                {tab === 'agents-list' && <Users size={16} />}
                <span className="capitalize">{tab.replace('-', ' ')} {tab !== 'agents-list' && 'Stats'}</span>
              </button>
            ))}
          </div>
      </div>

      {/* Agent Stats Tab */}
      {activeTab === 'agents' && (
        <>
          {/* Header with Refresh and Date Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-foreground">Agent Statistics</h2>
            <div className="flex items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center p-1 bg-card border border-border rounded-xl">
                {['today', 'week', 'month', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize
                      ${dateFilter === filter
                        ? 'bg-primary text-foreground-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : `This ${filter}`}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefreshAgentStats}
                disabled={isRefreshingAgent}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-foreground-foreground rounded-lg transition-all duration-200 shadow-sm disabled:cursor-not-allowed text-xs font-medium"
              >
                <RefreshCw size={14} className={isRefreshingAgent ? 'animate-spin' : ''} />
                <span>{isRefreshingAgent ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {statsLoading || isRefreshingAgent ? (
            /* Beautiful Loading Skeleton */
            <div className="space-y-6 animate-pulse">
              {/* Top Row Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-4 shadow-sm border border-border"
                  >
                    <div className="h-3 bg-muted rounded w-2/3 mb-3"></div>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>

              {/* Second Row Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-4 shadow-sm border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                        <div className="h-2 bg-muted rounded w-1/2 mt-1"></div>
                      </div>
                      <div className="w-10 h-10 bg-muted rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Third Row Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-6 shadow-sm border border-border"
                  >
                    <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="flex justify-between items-center">
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-6 shadow-sm border border-border"
                  >
                    <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
                    <div className="h-64 bg-muted/50 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Top Row - Compact Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* CSAT Gauge - Compact */}
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    CSAT this month
                  </h3>
                  <div className="text-2xl font-bold text-foreground">
                    {agentStats.csatScore || 0}%
                  </div>
                </div>

                {/* Today Response Time */}
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Avg Response Time
                  </h3>
                  <div className="text-2xl font-bold text-foreground">
                    {agentStats.avgFirstResponseTime || agentStats.avgResponseTime || 0}
                    <span className="text-lg text-muted-foreground ml-1">m</span>
                  </div>
                </div>

                {/* Resolution Time */}
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Avg Resolution Time
                  </h3>
                  <div className="text-2xl font-bold text-foreground">
                    {agentStats.avgFullResolutionTime || 0}
                    <span className="text-lg text-muted-foreground ml-1">h</span>
                  </div>
                </div>

                {/* Unassigned Tickets */}
                <div className="relative bg-card rounded-xl p-4 shadow-sm border border-border overflow-hidden">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Unassigned tickets
                  </h3>
                  <div className="text-2xl font-bold text-foreground">
                    {agentStats.totalPendingQueries || 0}
                  </div>
                  {agentStats.totalPendingQueries > 20 && (
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                       <AlertCircle className="text-destructive mt-2 mr-2" size={16} />
                    </div>
                  )}
                </div>
              </div>

               {/* Second Row - Agent Team Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Agents"
                  value={systemHealth.agentCount || 0}
                  icon={Users}
                  color="text-indigo-500"
                  subtext={`${systemHealth.activeAgents || 0} currently active`}
                />

                <StatCard
                  title="Queries Resolved Today"
                  value={agentStats.resolvedToday || 0}
                  icon={CheckCircle}
                  color="text-emerald-500"
                  subtext="Agent team"
                />

                <StatCard
                  title="Active Chats"
                  value={agentStats.totalActiveChats || 0}
                  icon={MessageCircle}
                  color="text-blue-500"
                  subtext="In progress"
                />

                <StatCard
                  title="Avg Response Time"
                  value={`${agentStats.avgResponseTime || 0}m`}
                  icon={Clock}
                  color="text-amber-500"
                  subtext="Team average"
                />
              </div>

              {/* Third Row - Top Performers and Agent Scores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Top Ticket Solvers */}
                <TopPerformersList
                  title="Top ticket solvers this week"
                  data={topAgentSolvers}
                  scoreKey="count"
                />

                {/* Agent Scores */}
                <AgentScoresList title="Agent scores" data={agentScoresData} />
              </div>

              {/* Agent Activity Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <ChartContainer title="Agent Activity Distribution">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={agentActivityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {agentActivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="QA Team Activity Distribution">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={qaActivityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {qaActivityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </>
          )}
        </>
      )}

      {/* Query Stats Tab */}
      {activeTab === 'queries' && (
        <>
          {/* Header with Refresh and Date Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Global Query Statistics
            </h2>
            <div className="flex items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center p-1 bg-card border border-border rounded-xl">
                {['today', 'week', 'month', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize
                      ${dateFilter === filter
                        ? 'bg-primary text-foreground-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : `This ${filter}`}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefreshQueryStats}
                disabled={isRefreshingQuery}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-foreground-foreground rounded-lg transition-all duration-200 shadow-sm disabled:cursor-not-allowed text-xs font-medium"
              >
                <RefreshCw size={14} className={isRefreshingQuery ? 'animate-spin' : ''} />
                <span>{isRefreshingQuery ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {statsLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-4 shadow-sm border border-border"
                  >
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Queries"
                  value={overallStats.queries?.total || 0}
                  icon={HelpCircle}
                  color="text-purple-500"
                  subtext="All time"
                />
                <StatCard
                  title="Pending"
                  value={overallStats.queries?.pending || 0}
                  icon={Clock}
                  color="text-orange-500"
                  subtext="Awaiting response"
                />
                <StatCard
                  title="In Progress"
                  value={overallStats.queries?.inProgress || 0}
                  icon={Activity}
                  color="text-blue-500"
                  subtext="Being worked on"
                />
                <StatCard
                  title="Resolved"
                  value={overallStats.queries?.resolved || 0}
                  icon={CheckCircle}
                  color="text-green-500"
                  subtext="Successfully closed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <StatCard
                  title="Transferred"
                  value={overallStats.queries?.transferred || 0}
                  icon={TrendingUp}
                  color="text-indigo-500"
                  subtext="Escalated to other teams"
                />
              </div>

              {/* Query Insights Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Query Volume Trend */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Query Volume (Last 7 Days)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overallStats.queries?.trend || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))',
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" name="Queries" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Queries by Category */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Queries by Category
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overallStats.queries?.categories || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(overallStats.queries?.categories || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))',
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Conversation Trends */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">
                    Conversation Trends
                  </h3>
                  <select className="px-4 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:ring-1 focus:ring-primary">
                    <option>Last 90 days</option>
                    <option>Last 30 days</option>
                    <option>Last 7 days</option>
                  </select>
                </div>

                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overallStats.queries?.conversationTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="new"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        name="New conversations"
                      />
                      <Line
                        type="monotone"
                        dataKey="resolved"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Resolved conversations"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-8 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-muted-foreground"></div>
                    <span className="text-sm text-muted-foreground">
                      New conversations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                    <span className="text-sm text-muted-foreground">
                      Resolved conversations
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Email Ticket Stats Tab */}
      {activeTab === 'tickets' && (
        <>
          {/* Header with Date Filter and Refresh */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              Email Ticket Statistics
            </h2>
            <div className="flex items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center p-1 bg-card border border-border rounded-xl">
                {['today', 'week', 'month', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize
                      ${dateFilter === filter
                        ? 'bg-primary text-foreground-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : `This ${filter}`}
                  </button>
                ))}
              </div>
              {/* Refresh Button */}
              <button
                onClick={handleRefreshTicketStats}
                disabled={isRefreshingTicket}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-foreground-foreground rounded-lg transition-all duration-200 shadow-sm disabled:cursor-not-allowed text-xs font-medium"
              >
                <RefreshCw size={14} className={isRefreshingTicket ? 'animate-spin' : ''} />
                <span>{isRefreshingTicket ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {ticketStatsLoading ? (
            /* Beautiful Loading Skeleton for Email Tickets */
            <div className="space-y-6 animate-pulse">
              {/* Top Row Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-4 shadow-sm border border-border"
                  >
                    <div className="h-3 bg-muted rounded w-2/3 mb-3"></div>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>

              {/* Second Row Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-4 shadow-sm border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                        <div className="h-2 bg-muted rounded w-1/2 mt-1"></div>
                      </div>
                      <div className="w-10 h-10 bg-muted rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Priority Breakdown Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-6 shadow-sm border border-border"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-muted rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-6 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                ))}
              </div>

              {/* Charts Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-6 shadow-sm border border-border"
                  >
                    <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
                    <div className="h-48 bg-muted/50 rounded-lg"></div>
                  </div>
                ))}
              </div>

              {/* Large Chart Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-6 shadow-sm border border-border"
                  >
                    <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
                    <div className="h-64 bg-muted/50 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
                <>
                  {/* Top Row - Compact Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {/* CSAT - Compact */}
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">CSAT this month</h3>
                  <div className="text-2xl font-bold text-foreground">{ticketStats.csatScore || 0}%</div>
                </div>
                
                {/* Resolution Time */}
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Avg Resolution Time</h3>
                  <div className="text-2xl font-bold text-foreground">{agentStatsTicket.avgResolutionTime || 0}<span className="text-lg text-muted-foreground ml-1">h</span></div>
                </div>

                {/* Unassigned Tickets */}
                <div className="relative bg-card rounded-xl p-4 shadow-sm border border-border overflow-hidden">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Unassigned tickets
                  </h3>
                  <div className="text-2xl font-bold text-foreground">
                    {ticketData.unassigned || 0}
                  </div>
                  {(ticketData.unassigned || 0) > 20 && (
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                       <AlertCircle className="text-destructive mt-2 mr-2" size={16} />
                    </div>
                  )}
                </div>
              </div>

              {/* Second Row - Ticket Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Tickets"
                  value={ticketData.total || 0}
                  icon={Mail}
                  color="text-blue-500"
                  subtext="All email tickets"
                />
                <StatCard
                  title="Open Tickets"
                  value={ticketData.open || 0}
                  icon={AlertCircle}
                  color="text-orange-500"
                  subtext="Awaiting response"
                />
                <StatCard
                  title="In Progress"
                  value={ticketData.inProgress || 0}
                  icon={Clock}
                  color="text-yellow-500"
                  subtext="Being worked on"
                />
                <StatCard
                  title="Resolved Today"
                  value={agentStatsTicket.resolvedToday || 0}
                  icon={CheckCircle}
                  color="text-green-500"
                  subtext="Successfully closed"
                />
              </div>

              {/* Third Row - Priority Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* High Priority */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">High Priority</h3>
                      <div className="text-2xl font-bold text-foreground">
                        {priorityStats.high || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Urgent tickets requiring immediate attention
                  </div>
                </div>

                {/* Medium Priority */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Info size={24} className="text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Medium Priority</h3>
                      <div className="text-2xl font-bold text-foreground">
                        {priorityStats.medium || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Standard tickets with normal processing
                  </div>
                </div>

                {/* Low Priority */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-card0/10 rounded-xl">
                      <CheckCircle size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Low Priority</h3>
                      <div className="text-2xl font-bold text-foreground">
                        {priorityStats.low || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Low urgency tickets can be processed later
                  </div>
                </div>
              </div>

              {/* Fourth Row - Top Performers and Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Top Ticket Solvers */}
                <TopPerformersList
                  title="Top ticket solvers this week"
                  data={topAgentSolvers}
                  scoreKey="count"
                />

                {/* Tickets by Status */}
                <StatusBarChart
                  title="Tickets by status this week"
                  data={[
                    { name: 'Open', value: ticketData.open || 0, color: 'hsl(var(--primary))' },
                    { name: 'Pending', value: ticketData.pending || 0, color: 'hsl(var(--warning))' },
                    { name: 'Resolved', value: ticketData.resolved || 0, color: 'hsl(var(--success))' },
                    { name: 'Closed: Resolved', value: ticketData.closed || 0, color: 'hsl(var(--info))' },
                  ]}
                />

                {/* QA This Week */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6">
                    QA this week
                  </h3>
                  <div className="bg-muted/50 rounded-xl p-4 border border-border">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Avg. team score
                    </h3>
                    <div className="text-3xl font-bold text-foreground">
                      {qaStats.approvalRate || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Quality assurance
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Status Conversation Trend - Full Width */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-foreground">
                    Ticket Conversation Trends
                  </h3>
                  <div className="text-sm text-muted-foreground">Last 7 days</div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ticketStats.performanceStats?.ticketStatusTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend 
                        formatter={(value) => <span className="text-foreground">{value}</span>}
                      />
                      <Line
                        type="monotone"
                        dataKey="open"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Open Tickets"
                        dot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pending"
                        stroke="hsl(var(--warning))"
                        strokeWidth={2}
                        name="Pending Tickets"
                        dot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--warning))' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--warning))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="closed"
                        stroke="hsl(var(--success))"
                        strokeWidth={2}
                        name="Closed Tickets"
                        dot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--success))' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--success))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fifth Row - Agent Scores */}
              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Agent Scores */}
                <AgentScoresList title="Agent scores" data={agentScoresData} />
              </div>

              {/* Widget User Stats */}
              {ticketStats.widgetUserStats && (
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Users size={20} className="text-foreground" />
                    Widget User Activity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Total Widget Users
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {ticketStats.widgetUserStats.totalUsers || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Active Users (24h)
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {ticketStats.widgetUserStats.activeUsersLast24Hours || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        New Users (7d)
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {ticketStats.widgetUserStats.newUsersLast7Days || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Status Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Agent Activity Details */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Users size={20} className="text-foreground" />
                    Agent Team Activity Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Currently Active
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Working on queries
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-success">
                        {agentStats.activityStatus?.currentlyActive || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          On Break
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Taking a break
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-warning">
                        {agentStats.activityStatus?.onBreak || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Offline
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Not logged in
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-muted-foreground">
                        {agentStats.activityStatus?.offline || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Avg Active Time
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Per agent</p>
                      </div>
                      <p className="text-xl font-bold text-foreground">
                        {agentStats.activityStatus?.avgActiveTime || '0h 0m'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QA Activity Details */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                    <CheckCircle size={20} className="text-foreground" />
                    QA Team Activity Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Currently Active
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reviewing tickets
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-success">
                        {qaStats.activityStatus?.currentlyActive || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          On Break
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Taking a break
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-warning">
                        {qaStats.activityStatus?.onBreak || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Offline
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Not logged in
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-muted-foreground">
                        {qaStats.activityStatus?.offline || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Avg Active Time
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Per QA member
                        </p>
                      </div>
                      <p className="text-xl font-bold text-foreground">
                        {qaStats.activityStatus?.avgActiveTime || '0h 0m'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Availability */}
              <div className="mb-6">
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6">Overall User Availability</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userAvailabilityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) =>
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          }
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {userAvailabilityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--card))" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Communication Channels */}
      {/* <div className="mb-8">
        <ChartContainer title="Communication Channels Overview">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={communicationData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis dataKey="name" stroke={chartColors.text} />
              <YAxis stroke={chartColors.text} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: isDark ? '#e2e8f0' : '#1f2937',
                }}
              />
              <Bar dataKey="value" fill={chartColors.line} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div> */}

      {/* Individual Agent Performance Cards */}
      {/* <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Users size={24} className="text-foreground " />
          Agent Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentStats.topAgents && agentStats.topAgents.length > 0 ? (
            agentStats.topAgents.slice(0, 6).map((agent, idx) => (
              <div key={idx} className="bg-card  rounded-xl p-6 shadow-lg border border-border  hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground ">{agent.email}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {agent.status || 'offline'}
                  </span>
                </div>

                <div className="space-y-3 mb-4 pb-4 border-b border-border ">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground ">Resolved Today</span>
                    <span className="text-lg font-bold text-green-600 ">{agent.resolvedToday}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground ">Active Chats</span>
                    <span className="font-semibold text-foreground">{agent.activeChats}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-muted-foreground ">
              Loading agent performance data...
            </div>
          )}
        </div>
      </div> */}

      {/* Individual QA Performance Cards */}
      {/* <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <CheckCircle size={24} className="text-amber-600 dark:text-amber-400" />
          QA Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qaStats.topQA && qaStats.topQA.length > 0 ? (
            qaStats.topQA.slice(0, 6).map((qa, idx) => (
              <div key={idx} className="bg-card  rounded-xl p-6 shadow-lg border border-border  hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{qa.name}</h4>
                    <p className="text-sm text-muted-foreground ">{qa.email}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {qa.status || 'offline'}
                  </span>
                </div>

                <div className="space-y-3 mb-4 pb-4 border-b border-border ">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground ">Approved Today</span>
                    <span className="text-lg font-bold text-green-600 ">{qa.approvedToday}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground ">Pending Reviews</span>
                    <span className="font-semibold text-foreground">{qa.pendingReviews}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground ">Escalations</span>
                    <span className="font-semibold text-foreground">{qa.escalationsHandled}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-muted-foreground ">
              Loading QA performance data...
            </div>
          )}
        </div>
      </div> */}

      {/* System Summary Cards */}
      {(activeTab === 'agents' || activeTab === 'queries') && (
        <div className="bg-card  rounded-lg p-4 shadow-md border border-border  backdrop-blur-sm mb-4">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-foreground " />
            System Summary & KPIs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-card  rounded-lg border border-primary/20 dark:border-blue-800">
              <p className="text-xs text-foreground  font-semibold mb-2">
                Query Resolution Rate
              </p>
              <p className="text-2xl font-bold bg-primary dark:text-blue-300">
                {overallStats.totalQueries > 0
                  ? Math.round((overallStats.resolvedQueries / overallStats.totalQueries) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-foreground  mt-2">
                {overallStats.resolvedQueries} of {overallStats.totalQueries} resolved
              </p>
            </div>

            <div className="p-3 bg-primary/5 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600  font-semibold mb-2">
                System Availability
              </p>
              <p className="text-2xl font-bold bg-primary dark:text-green-300">
                {systemHealth.totalUsers > 0
                  ? Math.round((systemHealth.activeUsers / systemHealth.totalUsers) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-green-600  mt-2">
                {systemHealth.activeUsers} of {systemHealth.totalUsers} online
              </p>
            </div>

            {/* Removed Avg Customer Rating card (customer feedback not required) */}

            {/* Calls Made Today card removed */}

            <div className="p-5 bg-primary/5 dark:bg-indigo-900/20 rounded-lg border border-primary/20 dark:border-indigo-800">
              <p className="text-sm text-indigo-600  font-semibold mb-3">
                Emails Sent Today
              </p>
              <p className="text-3xl font-bold bg-primary dark:text-indigo-300">
                {agentStats.emailsSent || 0}
              </p>
              <p className="text-xs text-indigo-600  mt-3">Agent team total</p>
            </div>

            <div className="p-5 bg-primary/5 dark:bg-teal-900/20 rounded-lg border border-primary/20 dark:border-teal-800">
              <p className="text-sm bg-primary  font-semibold mb-3">
                High Priority Queries
              </p>
              <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">
                {agentStats.highPriorityQueries || 0}
              </p>
              <p className="text-xs bg-primary  mt-3">Pending assignment</p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Feedback Tab */}
      {activeTab === 'feedback' && (
        <>
          {/* Header with Date Filter and Refresh */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Customer Feedback & CSAT
            </h2>
            <div className="flex items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center p-1 bg-card border border-border rounded-xl">
                {['today', 'week', 'month', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize
                      ${dateFilter === filter
                        ? 'bg-primary text-foreground-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : `This ${filter}`}
                  </button>
                ))}
              </div>
              {/* Refresh Button */}
              <button
                onClick={handleRefreshFeedback}
                disabled={isRefreshingFeedback}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-foreground-foreground rounded-lg transition-all duration-200 shadow-sm disabled:cursor-not-allowed text-xs font-medium"
              >
                <RefreshCw size={14} className={isRefreshingFeedback ? 'animate-spin' : ''} />
                <span>{isRefreshingFeedback ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {feedbackLoading || isRefreshingFeedback ? (
            /* Loading Skeleton */
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl p-6 shadow-sm border border-border"
                  >
                    <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                        <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
                        <div className="h-48 bg-muted/50 rounded-lg"></div>
                    </div>
                 ))}
              </div>
            </div>
          ) : (
            <>
              {/* CSAT Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Overall CSAT */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Award size={64} className="text-foreground" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Overall CSAT Score
                    </h3>
                    <Award size={20} className="text-foreground" />
                  </div>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {feedbackStats.overall?.csat || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Based on {feedbackStats.overall?.totalFeedback || 0} ratings
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < Math.round(feedbackStats.overall?.avgRating || 0)
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Average Rating */}
                <StatCard
                  title="Average Rating"
                  value={`${(feedbackStats.overall?.avgRating || 0).toFixed(1)} / 5.0`}
                  icon={Target}
                  color="text-blue-500"
                  subtext={`From ${feedbackStats.overall?.totalFeedback || 0} reviews`}
                />

                {/* QA Team CSAT */}
                <StatCard
                  title="QA Team CSAT"
                  value={`${qaStats.avgFeedbackRating 
                    ? Math.round((qaStats.avgFeedbackRating / 5) * 100)
                    : 0}%`}
                  icon={UserCheck}
                  color="text-purple-500"
                  subtext={`${qaStats.totalFeedbackCount || 0} QA reviews`}
                />

                {/* Total Feedback Count */}
                <StatCard
                  title="Total Feedback Received"
                  value={feedbackStats.overall?.totalFeedback || 0}
                  icon={MessageCircle}
                  color="text-green-500"
                  subtext="All time feedback"
                />
              </div>

              {/* Rating Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Rating Breakdown */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-foreground" />
                    Rating Distribution
                  </h3>
                  <div className="space-y-4">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = feedbackStats.ratingDistribution?.[rating] || 0;
                      const percentage = feedbackStats.overall?.totalFeedback 
                        ? (count / feedbackStats.overall.totalFeedback) * 100
                        : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-12">
                            <span className="text-sm font-medium text-foreground">
                              {rating}
                            </span>
                            <span className="text-yellow-500 text-xs">★</span>
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                  rating >= 4
                                    ? 'bg-success'
                                    : rating === 3
                                    ? 'bg-warning'
                                    : 'bg-destructive'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CSAT Trend */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-success" />
                    CSAT Trend (Last 7 Days)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={feedbackStats.trend || []}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                        />
                         <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="csat"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Rated Agents */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-6">
                <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Award size={20} className="text-foreground" />
                  Top Rated Agents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {feedbackStats.agentStats?.slice(0, 6).map((agent, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-muted/30 rounded-xl border border-border hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {agent.name || 'Unknown'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {agent.email}
                          </p>
                        </div>
                        {idx < 3 && (
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-card text-foreground font-bold text-sm">
                            #{idx + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${
                                  i < Math.round(agent.avgRating || 0)
                                    ? 'text-yellow-500'
                                    : 'text-muted'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(agent.avgRating || 0).toFixed(1)} / 5.0
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {agent.csat || 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">CSAT</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Total Reviews</p>
                          <p className="font-semibold text-foreground">
                            {agent.totalFeedback || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Rating</p>
                          <p className="font-semibold text-foreground">
                            {(agent.avgRating || 0).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Performance Comparison */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6">
                    Agent CSAT Comparison
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={feedbackStats.agentStats?.slice(0, 8).map((agent) => ({
                          name: (agent.name || 'Unknown').split(' ')[0],
                          csat: agent.csat || 0,
                        })) || []}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11} 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12} 
                          domain={[0, 100]} 
                          tickLine={false}
                          axisLine={false}
                        />
                         <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Bar 
                          dataKey="csat" 
                          fill="hsl(var(--primary))" 
                          radius={[8, 8, 0, 0]} 
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Insights */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-6">
                    Key Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-success flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-semibold text-success mb-1">
                            Excellent Performance
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {feedbackStats.agentStats?.filter(a => (a.avgRating || 0) >= 4.5).length || 0} agents 
                            have CSAT scores above 90%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-xl border border-primary/20">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="text-foreground flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-semibold text-foreground mb-1">
                            Monthly Improvement
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Overall CSAT improved by 5% compared to last month
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-warning/10 rounded-xl border border-warning/20">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-warning flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-semibold text-warning mb-1">
                            Needs Attention
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {feedbackStats.agentStats?.filter(a => (a.avgRating || 0) < 3.5).length || 0} agents 
                            need coaching to improve customer satisfaction
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <div className="flex items-start gap-3">
                        <Target className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                            Response Time Impact
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Agents with &lt;5 min response time have 15% higher CSAT scores
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* All Agents List Tab */}
      {activeTab === 'agents-list' && (
        <>
          {/* Header with Date Filter and Refresh */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">All Agents</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Complete list of all agents with performance metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center p-1 bg-card border border-border rounded-xl">
                {['today', 'week', 'month', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize
                      ${dateFilter === filter
                        ? 'bg-primary text-foreground-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : `This ${filter}`}
                  </button>
                ))}
              </div>
              {/* Refresh Button */}
              <button
                onClick={handleRefreshAgentStats}
                disabled={isRefreshingAgent}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-foreground-foreground rounded-lg transition-all duration-200 shadow-sm disabled:cursor-not-allowed text-xs font-medium"
              >
                <RefreshCw size={14} className={isRefreshingAgent ? 'animate-spin' : ''} />
                <span>{isRefreshingAgent ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {statsLoading || isRefreshingAgent ? (
            /* Loading Skeleton */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border"
                >
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded"></div>
                    <div className="h-2 bg-muted rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatCard
                  title="Total Agents"
                  value={actualActivityCounts.totalAgents}
                  icon={Users}
                  color="text-foreground"
                  subtext="In organization"
                />
                <StatCard
                  title="Active Now"
                  value={actualActivityCounts.currentlyActive}
                  icon={Zap}
                  color="text-success"
                  subtext="Currently working"
                />
                <StatCard
                  title="On Break"
                  value={actualActivityCounts.onBreak}
                  icon={Clock}
                  color="text-warning"
                  subtext="Taking a break"
                />
                <StatCard
                  title="Offline"
                  value={actualActivityCounts.offline}
                  icon={AlertCircle}
                  color="text-muted-foreground"
                  subtext="Not logged in"
                />
              </div>

              {/* Agents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentStats.topAgents && agentStats.topAgents.length > 0 ? (
                  agentStats.topAgents.map((agent, idx) => (
                    <div
                      key={idx}
                      className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300"
                    >
                      {/* Agent Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            {agent.name || 'Unknown'}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            {agent.email}
                          </p>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              agent.status === 'active'
                                ? 'bg-success/10 text-success'
                                : agent.status === 'break'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                agent.status === 'active'
                                  ? 'bg-success'
                                  : agent.status === 'break'
                                  ? 'bg-warning'
                                  : 'bg-muted-foreground'
                              }`}
                            ></span>
                            {agent.status === 'active'
                              ? 'Active'
                              : agent.status === 'break'
                              ? 'On Break'
                              : 'Offline'}
                          </span>
                        </div>
                        {idx < 3 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-foreground-foreground font-bold text-xs shadow-sm">
                            #{idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Performance Stats */}
                      <div className="space-y-3 mb-4 pb-4 border-b border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Resolved Today
                          </span>
                          <span className="text-lg font-bold text-success">
                            {agent.resolvedToday || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Total Resolved
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {agent.totalResolved || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Active Chats
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {agent.activeChats || 0}
                          </span>
                        </div>
                      </div>

                      {/* Additional Metrics */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                          <p className="text-xs text-foreground mb-1">
                            Avg Response
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {agent.avgResponseTime || 0}
                            <span className="text-xs ml-0.5 text-muted-foreground">m</span>
                          </p>
                        </div>
                        <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                            Rating
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-foreground">
                              {(agent.avgFeedbackRating || 0).toFixed(1)}
                            </span>
                            <span className="text-yellow-500 text-sm">★</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-success/10 rounded-xl p-3 border border-success/20">
                          <p className="text-xs text-success mb-1">
                            Calls Made
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {agent.callsMade || 0}
                          </p>
                        </div>
                        <div className="bg-card0/10 rounded-xl p-3 border border-blue-500/20">
                          <p className="text-xs text-foreground  mb-1">
                            Emails Sent
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {agent.emailsSent || 0}
                          </p>
                        </div>
                      </div>

                      {/* CSAT Score Bar */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            CSAT Score
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {agent.avgFeedbackRating
                              ? Math.round((agent.avgFeedbackRating / 5) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                agent.avgFeedbackRating
                                  ? (agent.avgFeedbackRating / 5) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-12 text-center">
                    <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg">
                      No agents found in the system
                    </p>
                  </div>
                )}
              </div>

              {/* Agent Performance Summary Table */}
              {agentStats.topAgents && agentStats.topAgents.length > 0 && (
                <div className="mt-6 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground">
                      Performance Comparison Table
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                            Rank
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                            Agent
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                            Today
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                            Total
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                            Active
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                            Avg Time
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                            Rating
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                            CSAT
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {agentStats.topAgents.map((agent, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-foreground">
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {agent.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {agent.email}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  agent.status === 'active'
                                    ? 'bg-success/10 text-success'
                                    : agent.status === 'break'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {agent.status === 'active'
                                  ? 'Active'
                                  : agent.status === 'break'
                                  ? 'Break'
                                  : 'Offline'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-semibold text-success">
                                {agent.resolvedToday || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-semibold text-foreground">
                                {agent.totalResolved || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-semibold text-foreground">
                                {agent.activeChats || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-foreground">
                                {agent.avgResponseTime || 0}m
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-semibold text-foreground">
                                  {(agent.avgFeedbackRating || 0).toFixed(1)}
                                </span>
                                <span className="text-yellow-500 text-xs">★</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-bold text-foreground">
                                {agent.avgFeedbackRating
                                  ? Math.round((agent.avgFeedbackRating / 5) * 100)
                                  : 0}
                                %
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
