import React, { useState } from 'react';
import {
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
  BarChart3,
  TrendingUp,
  Users,
  RefreshCw,
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import DashboardSkeleton from '../Skeletons/DashboardSkeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';

import {
  useGetTicketStatsQuery,
  useGetMyTicketStatsQuery,
} from '../../features/emailTicket/emailTicketApi';
import { CircularProgress } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// Stat Card Component
function StatCard({ icon: Icon, label, value, subtext, color }) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  const iconClass = colorMap[color] || 'bg-primary/10 text-primary';

  return (
    <div className="p-6 rounded-xl border bg-card border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <h3 className="text-3xl font-bold mt-1 text-foreground">
            {value}
          </h3>
          {subtext && (
            <p className="text-xs mt-1 text-muted-foreground">
              {subtext}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function TicketStats({ userRole = 'Agent', reviewMetrics = null, refreshTrigger = 0 }) {


  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useGetTicketStatsQuery();
  const {
    data: myStatsData,
    isLoading: isLoadingMyStats,
    refetch: refetchMyStats,
  } = useGetMyTicketStatsQuery();
  
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      refetchStats();
      refetchMyStats();
    }
  }, [refreshTrigger, refetchStats, refetchMyStats]);

  const isLoading = isLoadingStats || isLoadingMyStats;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = statsData?.data || {};
  const myStats = myStatsData?.data || {};

  // Role-specific stats from myStats
  const ticketStats = stats.ticketStats || {};
  const priorityStats = stats.priorityStats || {};
  const categoryStats = stats.categoryStats || [];
  const agentStats = stats.agentStats || {};
  const performanceStats = stats.performanceStats || {};
  const departmentStats = myStats.departmentStats || [];
  const personalStats = myStats.personalStats || {};
  const escalatedStats = myStats.escalatedStats || {};
  const reviewStats = myStats.reviewStats || {};

  // Chart data for status distribution
  const statusChartData = {
    labels: ['Open', 'Pending', 'Closed'],
    datasets: [
      {
        label: 'Tickets',
        data: [ticketStats.open || 0, ticketStats.pending || 0, ticketStats.closed || 0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(120, 113, 108, 0.8)',
        ],
        borderColor: ['rgb(34, 197, 94)', 'rgb(249, 115, 22)', 'rgb(120, 113, 108)'],
        borderWidth: 2,
      },
    ],
  };

  // Chart data for priority distribution
  const priorityChartData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Priority',
        data: [priorityStats.high || 0, priorityStats.medium || 0, priorityStats.low || 0],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: ['rgb(239, 68, 68)', 'rgb(245, 158, 11)', 'rgb(34, 197, 94)'],
        borderWidth: 2,
      },
    ],
  };

  // Chart data for department distribution (Agent only)
  const departmentChartData = {
    labels: departmentStats.map((d) => d.department),
    datasets: [
      {
        label: 'Tickets',
        data: departmentStats.map((d) => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(16, 185, 129, 0.8)', // Emerald
          'rgba(249, 115, 22, 0.8)', // Orange
          'rgba(139, 92, 246, 0.8)', // Violet
          'rgba(236, 72, 153, 0.8)', // Pink
          'rgba(14, 165, 233, 0.8)', // Sky
          'rgba(234, 179, 8, 0.8)', // Yellow
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(249, 115, 22)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(14, 165, 233)',
          'rgb(234, 179, 8)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Chart data for 7-day trend
  const trendData = performanceStats.last7DaysTrend || [];
  const trendChartData = {
    labels: trendData.map((d) => {
      const date = new Date(d._id);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: userRole === 'Agent' ? 'Your Tickets (7-Day)' : 'Team Tickets (7-Day)',
        data: trendData.map((d) => d.count || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#1E1614',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Chart data for category distribution
  const categoryChartData = {
    labels: categoryStats.map((c) =>
      c.category
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    ),
    datasets: [
      {
        label: userRole === 'Agent' ? 'Your Resolved Tickets' : 'Team Tickets by Category',
        data: categoryStats.map((c) => c.count || 0),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(34, 197, 94)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#a8a29e',
          font: { size: 12, weight: 500 },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#1E1614',
        titleColor: '#fff',
        bodyColor: '#a8a29e',
        borderColor: '#292524',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
          color: '#a8a29e',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(120, 113, 108, 0.1)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: '#a8a29e',
          font: { size: 11, weight: 500 },
        },
        grid: { display: false },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#a8a29e',
          font: { size: 12, weight: 500 },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#1E1614',
        titleColor: '#fff',
        bodyColor: '#a8a29e',
        borderColor: '#292524',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
  };
  return (
    <div className="p-2 md:p-6 bg-card min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Ticket Statistics
          </h1>
          <p className={`${'text-muted-foreground'}`}>
            {userRole === 'Agent'
              ? 'Your ticket performance and metrics'
              : `Team-wide ticket metrics and analytics`}
          </p>
        </div>

      </div>

      {/* Main Stats Grid - Role Specific */}
      {userRole === 'Agent' ? (
        // Agent-specific stats from myStats
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard
            icon={Inbox}
            label="My Inbox"
            value={myStats.myInbox?.total || 0}
            subtext={`${myStats.myInbox?.open || 0} open, ${myStats.myInbox?.pending || 0} pending`}
            color="blue"
            
          />
          <StatCard
            icon={Mail}
            label="Open Tickets"
            value={myStats.myInbox?.open || 0}
            color="green"
            
          />
          <StatCard
            icon={CheckCircle2}
            label="My Resolved"
            value={myStats.myResolved || 0}
            color="indigo"
            
          />
          <StatCard
            icon={Users}
            label="Assigned by QA/TL"
            value={myStats.assignedByOthers || 0}
            subtext="Tickets assigned to you"
            color="purple"
            
          />
        </div>
      ) : userRole === 'QA' || userRole === 'TL' ? (
        // QA/TL-specific stats from myStats
        <div className="space-y-8 mb-8">
          {/* Section 1: My Personal Tickets */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${'text-foreground'}`}>
              My Personal Tickets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard
                icon={Inbox}
                label="My Inbox"
                value={personalStats.total || 0}
                color="blue"
                
              />
              <StatCard
                icon={Mail}
                label="Open"
                value={personalStats.open || 0}
                color="green"
                
              />
              <StatCard
                icon={AlertCircle}
                label="Pending"
                value={personalStats.pending || 0}
                color="amber"
                
              />
              <StatCard
                icon={CheckCircle2}
                label="Resolved"
                value={personalStats.resolved || 0}
                color="indigo"
                
              />
            </div>
          </div>

          {/* Section 2: Escalated Tickets */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Escalated Tickets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <StatCard
                icon={TrendingUp}
                label="Total Escalated"
                value={escalatedStats.total || 0}
                color="red"
                
              />
              <StatCard
                icon={Mail}
                label="Open Escalated"
                value={escalatedStats.open || 0}
                color="orange"
                
              />
              <StatCard
                icon={AlertCircle}
                label="Pending Escalated"
                value={escalatedStats.pending || 0}
                color="amber"
                
              />
            </div>
          </div>

          {/* Section 3: Ticket Reviews */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Ticket Reviews
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <StatCard
                icon={CheckCircle2}
                label="Total Reviewed"
                value={reviewStats.totalReviewed || 0}
                color="purple"
                
              />
              <StatCard
                icon={Clock}
                label="Reviewed Today"
                value={reviewStats.reviewedToday || 0}
                color="blue"
                
              />
              <StatCard
                icon={BarChart3}
                label="Avg Score"
                value={reviewStats.avgScore || 0}
                color="green"
                
              />
            </div>
          </div>
        </div>
      ) : (
        // Admin/default - organization-wide stats
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard
            icon={Inbox}
            label="Total Tickets"
            value={myStats.organization?.total || ticketStats.total || 0}
            color="blue"
            
          />
          <StatCard
            icon={Mail}
            label="Open"
            value={myStats.organization?.open || ticketStats.open || 0}
            color="green"
            
          />
          <StatCard
            icon={AlertCircle}
            label="Pending"
            value={myStats.organization?.pending || ticketStats.pending || 0}
            color="amber"
            
          />
          <StatCard
            icon={CheckCircle2}
            label="Closed"
            value={myStats.organization?.closed || ticketStats.closed || 0}
            color="indigo"
            
          />
        </div>
      )}

      {/* Second Row - Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
        {userRole === 'Agent' ? (
          <>
            <StatCard
              icon={TrendingUp}
              label="Total Assigned Today"
              value={myStats.todayAssigned || 0}
              color="blue"
              
            />
            <StatCard
              icon={AlertCircle}
              label="Pending"
              value={myStats.myInbox?.pending || 0}
              color="amber"
              
            />
          </>
        ) : (
          <>
            {userRole === 'Admin' && (
              <StatCard
                icon={TrendingUp}
                label="Assigned Today"
                value={ticketStats.today || 0}
                color="blue"
                
              />
            )}
            <StatCard
              icon={Users}
              label="Active Agents"
              value={agentStats.onlineAgents || 0}
              color="green"
              
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution (Team) OR Department Distribution (Agent) */}
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            {userRole === 'Agent' ? 'Department Distribution' : 'Status Distribution'}
          </h3>
          <div
            className="p-4 rounded-lg bg-muted/20"
            style={{ height: '300px' }}
          >
            {userRole === 'Agent' ? (
              departmentStats.length > 0 ? (
                <Doughnut data={departmentChartData} options={doughnutOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No department data available</p>
                </div>
              )
            ) : (
              <Doughnut data={statusChartData} options={doughnutOptions} />
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            Priority Breakdown
          </h3>
          <div
            className="p-4 rounded-lg bg-muted/20"
            style={{ height: '300px' }}
          >
            <Doughnut data={priorityChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* 7-Day Trend */}
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            7-Day Trend
          </h3>
          <div
            className="p-4 rounded-lg bg-muted/20"
            style={{ height: '300px' }}
          >
            {trendData.length > 0 ? (
              <Line data={trendChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        {categoryStats.length > 0 && (
          <div className="p-6 rounded-xl border bg-card border-border shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6 text-foreground">
              {userRole === 'Agent'
                ? 'Your Resolved Tickets by Category'
                : 'Team Tickets by Category'}
            </h3>
            <div
              className="p-4 rounded-lg bg-muted/20"
              style={{ height: '300px' }}
            >
              <Bar data={categoryChartData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Team Performance - Only for TL/QA */}
      {userRole !== 'Agent' && agentStats.topPerformers && (
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            Top Performing Agents
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-foreground">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Agent Name</th>
                  <th className="text-center py-3 px-4 font-semibold">Total</th>
                  <th className="text-center py-3 px-4 font-semibold">Open</th>
                  <th className="text-center py-3 px-4 font-semibold">Closed</th>
                  <th className="text-center py-3 px-4 font-semibold">Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {agentStats.topPerformers.map((performer, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border hover:bg-muted/10"
                  >
                    <td className="py-3 px-4 font-medium">{performer.agent?.name || 'Unknown'}</td>
                    <td className="text-center py-3 px-4">{performer.totalTickets}</td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/10 text-green-500">
                        {performer.openTickets}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-500">
                        {performer.closedTickets}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500/10 text-purple-500">
                        {performer.resolutionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agent Performance - Only for Agent role */}
      {userRole === 'Agent' && myStats.myInbox && (
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            Your Performance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground">
                Total Assigned
              </p>
              <p className="text-2xl font-bold mt-2 text-foreground">
                {myStats.myInbox?.total || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground">
                Open
              </p>
              <p className="text-2xl font-bold mt-2 text-emerald-500">
                {myStats.myInbox?.open || 0}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground">
                Resolved
              </p>
              <p className="text-2xl font-bold mt-2 text-blue-500">{myStats.myResolved || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground">
                Assigned by QA/TL
              </p>
              <p className="text-2xl font-bold mt-2 text-purple-500">
                {myStats.assignedByOthers || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
