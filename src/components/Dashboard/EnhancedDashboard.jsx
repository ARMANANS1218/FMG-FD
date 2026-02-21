import React from 'react';
import {
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import RecentEscalations from '../Escalations/RecentEscalations';
import { CircularProgress } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EnhancedDashboard({
  userRole = 'Agent',
  dashboardStats = {},
  weeklyData = [],
}) {
  const stats = dashboardStats || {};
  const qaReviewMetrics = stats.qaReviewMetrics || null;

  const statusDistribution = [
    { label: 'Pending', value: stats.pendingQueries || 0, color: '#f59e0b' },
    { label: 'Active', value: stats.activeChats || 0, color: '#6366f1' },
    { label: 'Resolved Today', value: stats.resolvedToday || 0, color: '#10b981' },
    { label: 'High Priority', value: stats.highPriorityQueries || 0, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const statusChartData = {
    labels: statusDistribution.map((item) => item.label),
    datasets: [
      {
        data: statusDistribution.map((item) => item.value),
        backgroundColor: statusDistribution.map((item) => item.color),
        borderColor: 'hsl(var(--card))',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  return (
    <div className="p-2 md:p-6 bg-background  min-h-screen">


      {/* Agent Dashboard Layout */}
      {userRole === 'Agent' ? (
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              label="Resolved Today"
              value={stats.resolvedToday || 0}
              color="green"
              
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Total Resolved"
              value={stats.totalResolvedQueries || 0}
              color="blue"
              
            />
            <StatCard
              icon={<AlertCircle className="w-6 h-6" />}
              label="Pending Queries"
              value={stats.pendingQueries || 0}
              color="amber"
              
            />
            <StatCard
              icon={<MessageCircle className="w-6 h-6" />}
              label="Active Chats"
              value={stats.activeChats || 0}
              color="indigo"
              
            />
          </div>

          {/* Escalated Queries Section */}
          {stats.escalatedQueries && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Escalated Queries
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  icon={<RefreshCw className="w-6 h-6" />}
                  label="Total Escalated"
                  value={stats.escalatedQueries.total || 0}
                  color="orange"
                  
                />
                <StatCard
                  icon={<Clock className="w-6 h-6" />}
                  label="Open Escalated"
                  value={stats.escalatedQueries.open || 0}
                  color="red"
                  
                />
                <StatCard
                  icon={<AlertCircle className="w-6 h-6" />}
                  label="Active Escalated"
                  value={stats.escalatedQueries.active || 0}
                  color="amber"
                  
                />
                <StatCard
                  icon={<CheckCircle className="w-6 h-6" />}
                  label="Resolved by Me"
                  value={stats.escalatedQueries.resolved || 0}
                  color="green"
                  
                />
              </div>
            </div>
          )}

          {/* Query Productivity */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              <ActivityCard 
                icon={<Clock className="w-5 h-5" />}
                label="Avg Response Time"
                value={`${stats.avgResponseTime ? stats.avgResponseTime : 0}m`}
                color="indigo"
                
              />
              <ActivityCard 
                icon={<AlertCircle className="w-5 h-5" />}
                label="High Priority In Queue"
                value={stats.highPriorityQueries || 0}
                color="red"
                
              />
              <ActivityCard 
                icon={<MessageCircle className="w-5 h-5" />}
                label="Active Query Threads"
                value={stats.activeChats || 0}
                color="blue"
                
              />
            </div> */}

          {/* Performance Summary */}
          <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Performance Summary
            </h3>
            <div className="space-y-3">
              <SummaryRow
                label="Total Queries Handled"
                value={stats.totalResolvedQueries || 0}
                
              />
              {/* <SummaryRow 
                  label="High Priority Queries"
                  value={stats.highPriorityQueries || 0}
                  
                /> */}
            </div>
          </div>

          <StatusDistributionCard
            statusDistribution={statusDistribution}
            statusChartData={statusChartData}
            
            className="mb-6"
          />

          {/* Weekly Performance Chart */}
          <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-foreground">
              Weekly Performance
            </h3>
            {weeklyData && weeklyData.length > 0 ? (
              <div className="p-4 rounded-lg bg-muted/20">
                <Bar
                  data={{
                    labels: weeklyData.map((item) => item.day),
                    datasets: [
                      {
                        label: 'Queries Resolved',
                        data: weeklyData.map((item) => item.value || 0),
                        backgroundColor: weeklyData.map((item, index) => {
                          const value = item.value || 0;
                          return `rgba(59, 130, 246, ${value === 0 ? 0.2 : 0.6 + index * 0.05})`;
                        }),
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                      },
                      {
                        label: 'Escalated',
                        data: weeklyData.map((item) => item.escalated || 0),
                        backgroundColor: weeklyData.map((item, index) => {
                          const value = item.escalated || 0;
                          return `rgba(249, 115, 22, ${value === 0 ? 0.2 : 0.6 + index * 0.05})`;
                        }),
                        borderColor: 'rgb(249, 115, 22)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 1500,
                      easing: 'easeInOutQuart',
                      delay: (context) => context.dataIndex * 100,
                    },
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
                        callbacks: {
                          label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                          },
                        },
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
                  }}
                  height={250}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No weekly performance data available</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* QA/TL Dashboard Layout */
        <>
          {/* Query Stats - Structured like Ticket Stats */}
          <div className="space-y-8 mb-8">
            {/* Section 1: My Personal Queries */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                My Query Review Metrics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <StatCard
                  icon={<AlertCircle className="w-6 h-6" />}
                  label="Queries Pending Review"
                  value={stats.qaReviewMetrics?.query?.pending || 0}
                  color="amber"
                  
                />
                <StatCard
                  icon={<CheckCircle className="w-6 h-6" />}
                  label="Query Reviews Today"
                  value={stats.queriesReviewedToday || 0}
                  color="green"
                  
                />
                <StatCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  label="Total Query Reviews"
                  value={stats.totalTicketsProcessed || 0}
                  color="indigo"
                  
                />
              </div>
            </div>

            {/* Section 2: Escalated Queries */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Escalated Queries
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  label="Total Escalated"
                  value={stats.escalatedQueries?.total || 0}
                  color="red"
                  
                />
                <StatCard
                  icon={<MessageCircle className="w-6 h-6" />}
                  label="Open Escalated"
                  value={stats.escalatedQueries?.open || 0}
                  color="orange"
                  
                />
                <StatCard
                  icon={<AlertCircle className="w-6 h-6" />}
                  label="Active Escalated"
                  value={stats.escalatedQueries?.active || 0}
                  color="amber"
                  
                />
                <StatCard
                  icon={<CheckCircle className="w-6 h-6" />}
                  label="Resolved by Me"
                  value={stats.escalatedQueries?.resolved || 0}
                  color="green"
                  
                />
              </div>
            </div>
          </div>

          {/* Team-Wide Stats Section */}
          {stats.teamStats && (
            <div className="space-y-8 mb-8">
              <div className="border-t-2 pt-6 border-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">
                  Team Performance (All Agents, TLs & QAs)
                </h2>

                {/* Team Section 1: Overall Queries */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    Overall Queries
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <StatCard
                      icon={<AlertCircle className="w-6 h-6" />}
                      label="Pending Queries"
                      value={stats.teamStats.pendingQueries || 0}
                      color="amber"
                      
                    />
                    <StatCard
                      icon={<MessageCircle className="w-6 h-6" />}
                      label="Active Chats"
                      value={stats.teamStats.activeChats || 0}
                      color="blue"
                      
                    />
                    <StatCard
                      icon={<CheckCircle className="w-6 h-6" />}
                      label="Resolved Today"
                      value={stats.teamStats.resolvedToday || 0}
                      color="green"
                      
                    />
                    <StatCard
                      icon={<TrendingUp className="w-6 h-6" />}
                      label="Total Resolved"
                      value={stats.teamStats.totalResolved || 0}
                      color="indigo"
                      
                    />
                  </div>
                </div>

                {/* Team Section 2: Team Escalated Queries */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    Team Escalated Queries
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <StatCard
                      icon={<RefreshCw className="w-6 h-6" />}
                      label="Total Escalated"
                      value={stats.teamStats.escalatedQueries?.total || 0}
                      color="red"
                      
                    />
                    <StatCard
                      icon={<Clock className="w-6 h-6" />}
                      label="Open Escalated"
                      value={stats.teamStats.escalatedQueries?.open || 0}
                      color="orange"
                      
                    />
                    <StatCard
                      icon={<AlertCircle className="w-6 h-6" />}
                      label="Active Escalated"
                      value={stats.teamStats.escalatedQueries?.active || 0}
                      color="amber"
                      
                    />
                    <StatCard
                      icon={<CheckCircle className="w-6 h-6" />}
                      label="Resolved"
                      value={stats.teamStats.escalatedQueries?.resolved || 0}
                      color="green"
                      
                    />
                  </div>
                </div>

                {/* Team Section 3: Team Query Reviews */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    Team Query Reviews
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <StatCard
                      icon={<CheckCircle className="w-6 h-6" />}
                      label="Total Query Reviews Done"
                      value={stats.teamStats.totalQueryReviews || 0}
                      color="purple"
                      
                    />
                    <StatCard
                      icon={<Clock className="w-6 h-6" />}
                      label="Queries Awaiting Review"
                      value={stats.qaReviewMetrics?.query?.pending || 0}
                      color="amber"
                      
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <StatusDistributionCard
            statusDistribution={statusDistribution}
            statusChartData={statusChartData}
            
            className="mb-6"
          />

          {/* QA Review Weightage Progress */}
          {userRole !== 'Agent' && qaReviewMetrics?.query && (
            <div className="p-6 rounded-xl border bg-card border-border shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Query Reviews (Weightage)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pending vs completed reviews based on applied weightage
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm bg-muted/50 text-muted-foreground">
                  Total Reviewed: {qaReviewMetrics.query.totalReviewed || 0}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="p-4 rounded-lg bg-card max-w-xs mx-auto">
                  <Doughnut
                    data={{
                      labels: ['Pending', 'Reviewed Today'],
                      datasets: [
                        {
                          data: [
                            qaReviewMetrics.query.pending || 0,
                            qaReviewMetrics.query.reviewedToday || 0,
                          ],
                          backgroundColor: [
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                          ],
                          borderColor: ['#f59e0b', '#22c55e'],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      cutout: '65%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: '#a8a29e',
                            boxWidth: 12,
                            padding: 12,
                          },
                        },
                      },
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Pending Reviews
                      </span>
                      <span className="text-sm font-semibold text-amber-500">
                        {qaReviewMetrics.query.pending || 0}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/30">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            qaReviewMetrics.query.totalReviewed + qaReviewMetrics.query.pending > 0
                              ? (qaReviewMetrics.query.pending /
                                  (qaReviewMetrics.query.totalReviewed +
                                    qaReviewMetrics.query.pending)) *
                                  100
                              : 0,
                            100
                          )}%`,
                          backgroundColor: '#f59e0b',
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Reviewed Today
                      </span>
                      <span className="text-sm font-semibold text-green-500">
                        {qaReviewMetrics.query.reviewedToday || 0}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/30">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            qaReviewMetrics.query.totalReviewed + qaReviewMetrics.query.pending > 0
                              ? (qaReviewMetrics.query.reviewedToday /
                                  (qaReviewMetrics.query.totalReviewed +
                                    qaReviewMetrics.query.pending)) *
                                  100
                              : 0,
                            100
                          )}%`,
                          backgroundColor: '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Escalations for QA/TL */}
          <div className="mb-8">
            <RecentEscalations limit={8}  />
          </div>

          {/* Weekly Performance Chart */}
          {weeklyData && weeklyData.length > 0 && (
            <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-6 text-foreground">
                Weekly Reviews
              </h3>
              <div className="p-4 rounded-lg bg-muted/20">
                <Bar
                  data={{
                    labels: weeklyData.map((item) => item.day),
                    datasets: [
                      {
                        label: 'Reviews',
                        data: weeklyData.map((item) => item.reviews || 0),
                        backgroundColor: weeklyData.map((item, index) => {
                          const value = item.reviews || 0;
                          return `rgba(34, 197, 94, ${value === 0 ? 0.2 : 0.6 + index * 0.05})`;
                        }),
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                      },
                      {
                        label: 'Escalated',
                        data: weeklyData.map((item) => item.escalated || 0),
                        backgroundColor: weeklyData.map((item, index) => {
                          const value = item.escalated || 0;
                          return `rgba(249, 115, 22, ${value === 0 ? 0.2 : 0.6 + index * 0.05})`;
                        }),
                        borderColor: 'rgb(249, 115, 22)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 1200,
                      easing: 'easeInOutQuart',
                      delay: (context) => context.dataIndex * 80,
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          color: '#a8a29e',
                          font: { size: 12, weight: 500 },
                          padding: 12,
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
                        callbacks: {
                          label: (context) => {
                            const value = context.parsed.y;
                            return `${context.dataset.label}: ${value}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 2,
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
                  }}
                  height={260}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusDistributionCard({ statusDistribution, statusChartData, className = '' }) {
  const totalCount = statusDistribution.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...statusDistribution.map((item) => item.value), 1);

  return (
    <div className={`p-6 rounded-xl border bg-card border-border shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Status Distribution</h3>
          <p className="text-sm text-muted-foreground">Current query load segmented by state</p>
        </div>
        {totalCount > 0 && (
          <div className="px-3 py-1 text-sm rounded-full bg-muted/50 text-muted-foreground">
            Total: {totalCount}
          </div>
        )}
      </div>

      {statusDistribution.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="mx-auto w-full max-w-xs">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#a8a29e', // stone-400
                      boxWidth: 12,
                      padding: 18,
                    },
                  },
                  tooltip: {
                    backgroundColor: '#1E1614',
                    titleColor: '#fff',
                    bodyColor: '#a8a29e',
                    borderColor: '#292524',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                      label: (context) => {
                        const value = context.raw;
                        const percent = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                        return `${context.label}: ${value} (${percent}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>

          <div className="space-y-3">
            {statusDistribution.map((item, index) => {
              const percent = totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0;
              return (
                <div
                  key={item.label}
                  className="p-3 rounded-lg border border-border bg-muted/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.value} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max((item.value / maxValue) * 100, 8)}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
          No status distribution data available yet.
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  const iconClass = colorMap[color] || 'bg-primary/10 text-primary';

  return (
    <div className="p-6 rounded-xl border bg-card border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <h3 className="text-3xl font-bold mt-1 text-foreground">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}

// Activity Card Component
function ActivityCard({ icon, label, value, color }) {
  const colorMap = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    green: 'bg-green-500/10 border-green-500/20 text-green-500',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    red: 'bg-red-500/10 border-red-500/20 text-red-500',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
  };

  const cardClass = colorMap[color] || 'bg-card border-border text-foreground';

  return (
    <div className={`p-2 rounded-lg border ${cardClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground opacity-90">{label}</p>
          <h3 className="text-2xl font-bold mt-1 text-foreground">{value}</h3>
        </div>
        <div className={`p-2 rounded-full`}>{icon}</div>
      </div>
    </div>
  );
}

// Summary Row Component
function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}
