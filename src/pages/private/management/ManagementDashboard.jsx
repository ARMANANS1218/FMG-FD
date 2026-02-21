import React, { useContext } from 'react';
import { useGetDashboardStatsQuery } from '../../../features/dashboard/dashboardApi';
import { useGetAllEmployeesQuery } from '../../../features/admin/adminApi';
import { useGetAllAttendanceQuery } from '../../../features/attendance/attendanceApi';
import {
  Users,
  UserCheck,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Activity,
  Building2,
  Clock,
  UserX,
  ShieldCheck,
  Ban,
  WifiOff,
  AlertTriangle,
  Coffee,
} from 'lucide-react';
import ManagementDashboardSkeleton from '../../../components/Skeletons/ManagementDashboardSkeleton';
import ColorModeContext from '../../../context/ColorModeContext';
import { jwtDecode } from 'jwt-decode';

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';

  const colorMap = {
    blue: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600',
    green: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600',
    amber: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600',
    red: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600',
    indigo: isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600',
    purple: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600',
    orange: isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600',
    teal: isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-100 text-teal-600',
    rose: isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-600',
    gray: isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600',
  };

  return (
    <div
      className={`p-6 rounded-xl border bg-card border-border shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <h3 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value ?? 0}
          </h3>
          {subtitle && (
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const ManagementDashboard = () => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  const [organizationName, setOrganizationName] = React.useState('');

  React.useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        if (decoded.organizationName) {
          setOrganizationName(decoded.organizationName);
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useGetAllEmployeesQuery();

  // Fetch attendance for today
  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceData, isLoading: attendanceLoading } = useGetAllAttendanceQuery({
    date: today,
  });

  const stats = statsData?.data || {};
  const systemHealth = stats?.systemHealth || stats?.overall?.systemHealth || {};
  const employees = employeesData?.data || [];
  const attendance = attendanceData?.attendance || [];

  // Calculate employee stats
  const agentCount = employees.filter((e) => e.role === 'Agent').length;
  const qaCount = employees.filter((e) => e.role === 'QA').length;
  const tlCount = employees.filter((e) => e.role === 'TL').length;

  const targetRoles = ['Agent', 'QA', 'TL'];
  const activeEmployees = employees.filter(
    (e) => targetRoles.includes(e.role) && e.is_active && e.workStatus === 'active'
  ).length;
  const blockedEmployees = employees.filter(
    (e) => targetRoles.includes(e.role) && e.isBlocked
  ).length;
  const offlineEmployees = employees.filter(
    (e) => targetRoles.includes(e.role) && e.workStatus === 'offline'
  ).length;

  // Calculate Attendance Stats
  const presentCount = attendance.filter((a) =>
    ['Present', 'Late', 'On Time'].includes(a.status)
  ).length;
  const halfDayCount = attendance.filter((a) => a.status === 'Half Day').length;
  const absentCount = Math.max(0, employees.length - attendance.length);

  // TL Stats
  const tls = employees.filter((e) => e.role === 'TL');
  const activeTLs = tls.filter((e) => ['active', 'busy'].includes(e.workStatus)).length;

  // QA Stats
  const qaStats = stats.qa || {};
  // Calculate total escalated from topQA list if available, otherwise default to 0
  const totalEscalatedQA = qaStats.topQA
    ? qaStats.topQA.reduce((sum, qa) => sum + (qa.escalationsHandled || 0), 0)
    : 0;

  if (statsLoading || employeesLoading || attendanceLoading) {
    return <ManagementDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Management Dashboard
          </h1>
          {organizationName && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 rounded-lg border border-violet-200 dark:border-violet-700">
              <Building2 size={16} className="text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                {organizationName}
              </span>
            </div>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time overview of organization activities and performance metrics
        </p>
      </div>

      {/* Row 1: Employee Status Overview */}
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Workforce Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Employees */}
          <StatCard
            title="Total Employees"
            value={systemHealth?.totalUsers || 0}
            subtitle={`${systemHealth?.agentCount || 0} Agents, ${systemHealth?.qaCount || 0} QA, ${systemHealth?.tlCount || 0} TL`}
            icon={Users}
            color="indigo"
          />

          {/* Active Employees */}
          <StatCard
            title="Active Employees"
            value={activeEmployees}
            subtitle="Currently online"
            icon={UserCheck}
            color="green"
          />

          {/* Blocked Employees */}
          <StatCard
            title="Blocked Employees"
            value={blockedEmployees}
            subtitle="Access restricted"
            icon={Ban}
            color="red"
          />

          {/* Offline Employees */}
          <StatCard
            title="Offline Employees"
            value={offlineEmployees}
            subtitle="Not logged in"
            icon={WifiOff}
            color="gray"
          />
        </div>
      </div>

      {/* Row 2: Query Stats */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Query Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Chats */}
          <StatCard
            title="Active Chats"
            value={stats?.agent?.totalActiveChats || 0}
            subtitle="Current conversations"
            icon={MessageSquare}
            color="blue"
          />

          {/* Resolved Today */}
          <StatCard
            title="Resolved Today"
            value={stats?.agent?.resolvedToday || 0}
            subtitle="Queries resolved"
            icon={CheckCircle2}
            color="green"
          />

          {/* Pending Queries */}
          <StatCard
            title="Pending Queries"
            value={stats?.agent?.totalPendingQueries || 0}
            subtitle="Awaiting response"
            icon={AlertCircle}
            color="amber"
          />

          {/* Total Resolved */}
          <StatCard
            title="Total Resolved"
            value={stats?.overall?.queries?.resolved || 0}
            subtitle="All time"
            icon={TrendingUp}
            color="purple"
          />
        </div>
      </div>

      {/* Attendance Overview */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Attendance Overview (Today)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Present"
            value={presentCount}
            subtitle="Checked in today"
            icon={UserCheck}
            color="teal"
          />
          <StatCard
            title="Absent"
            value={absentCount}
            subtitle="Not checked in"
            icon={UserX}
            color="rose"
          />
          <StatCard
            title="Half Day"
            value={halfDayCount}
            subtitle="Short shift"
            icon={Clock}
            color="orange"
          />
        </div>
      </div>

      {/* Agent Performance */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Agent Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Chats"
            value={stats?.agent?.totalActiveChats || 0}
            subtitle="Current conversations"
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            title="Resolved Today"
            value={stats?.agent?.resolvedToday || 0}
            subtitle="Queries resolved"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Total Resolved"
            value={stats?.agent?.totalResolved || 0}
            subtitle="All time"
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Total Pending"
            value={stats?.agent?.totalPendingQueries || 0}
            subtitle="Awaiting response"
            icon={AlertCircle}
            color="amber"
          />
          <StatCard
            title="Total Escalated"
            value={stats?.agent?.totalEscalated || 0}
            subtitle="High priority queries"
            icon={AlertTriangle}
            color="orange"
          />
          <StatCard
            title="Today Escalated"
            value={stats?.agent?.todayEscalated || 0}
            subtitle="Escalated today"
            icon={AlertTriangle}
            color="red"
          />
        </div>
      </div>

      {/* QA Performance */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          QA Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Chats"
            value={0}
            subtitle="Current conversations"
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            title="Total Reviewed"
            value={qaStats.totalTicketsReviewed || 0}
            subtitle="All time"
            icon={ShieldCheck}
            color="indigo"
          />
          <StatCard
            title="Total Pending"
            value={stats?.qa?.totalPending || 0}
            subtitle="Pending review"
            icon={AlertCircle}
            color="amber"
          />
          <StatCard
            title="Reviewed Today"
            value={qaStats.approvedToday || 0}
            subtitle="Tickets reviewed"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Total Resolved"
            value={stats?.qa?.totalResolved || 0}
            subtitle="Resolved by QA"
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Total Escalated"
            value={stats?.qa?.totalEscalated || 0}
            subtitle="Escalations handled"
            icon={AlertTriangle}
            color="orange"
          />
          <StatCard
            title="Today Escalated"
            value={stats?.qa?.todayEscalated || 0}
            subtitle="Escalated today"
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Escalated Resolved"
            value={stats?.qa?.escalatedResolved || 0}
            subtitle="Resolved escalations"
            icon={CheckCircle2}
            color="teal"
          />
        </div>
      </div>

      {/* TL Performance */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          TL Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Chats"
            value={0}
            subtitle="Current conversations"
            icon={MessageSquare}
            color="blue"
          />

          <StatCard
            title="Total Pending"
            value={stats?.tl?.totalPending || 0}
            subtitle="Pending review"
            icon={AlertCircle}
            color="amber"
          />
          <StatCard
            title="Total Resolved"
            value={stats?.tl?.totalResolved || 0}
            subtitle="Resolved by TL"
            icon={TrendingUp}
            color="purple"
          />

          <StatCard
            title="Total Escalated"
            value={stats?.tl?.totalEscalated || 0}
            subtitle="Escalations handled"
            icon={AlertTriangle}
            color="orange"
          />
          <StatCard
            title="Today Escalated"
            value={stats?.tl?.todayEscalated || 0}
            subtitle="Escalated today"
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Escalated Resolved"
            value={stats?.tl?.escalatedResolved || 0}
            subtitle="Resolved escalations"
            icon={CheckCircle2}
            color="teal"
          />
        </div>
      </div>

      {/* Employee Status Overview */}
      <div className={`rounded-xl border bg-card border-border shadow-sm overflow-hidden`}>
        <div className="p-6 border-b border-border">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Employee Status Overview
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {employees.map((employee) => (
              <div
                key={employee._id}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-muted/30 border-border`}
              >
                <div className="relative">
                  {employee.profileImage ? (
                    <img
                      src={employee.profileImage}
                      alt={employee.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {employee.name?.charAt(0)}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                      isDark ? 'border-gray-900' : 'border-white'
                    } ${
                      employee.isBlocked
                        ? 'bg-red-500'
                        : employee.workStatus === 'active'
                          ? 'bg-green-500'
                          : employee.workStatus === 'break'
                            ? 'bg-amber-500'
                            : 'bg-gray-400'
                    }`}
                  ></span>
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {employee.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {employee.role}
                    </span>
                    <span
                      className={`text-xs capitalize ${
                        employee.isBlocked
                          ? 'text-red-500'
                          : employee.workStatus === 'active'
                            ? 'text-green-500'
                            : employee.workStatus === 'break'
                              ? 'text-amber-500'
                              : 'text-gray-500'
                      }`}
                    >
                      {employee.isBlocked ? 'Blocked' : employee.workStatus || 'offline'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center mt-8 mb-4">
        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Read-only monitoring dashboard • Contact Admin for actions
        </p>
      </div>
    </div>
  );
};

export default ManagementDashboard;
