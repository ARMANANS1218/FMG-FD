import React, { useContext } from 'react';
import { Star, MessageSquare, TrendingUp, Users, BarChart3, RefreshCw } from 'lucide-react';
import DashboardSkeleton from '../Skeletons/DashboardSkeleton';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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
import ColorModeContext from '../../context/ColorModeContext';
import { useGetAgentFeedbackQuery } from '../../features/dashboard/dashboardApi';
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
function FeedbackStatCard({ icon: Icon, label, value, subtext, color }) {
  const colorClasses = {
    green: 'bg-emerald-500/10 text-emerald-500',
    blue: 'bg-blue-500/10 text-blue-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    purple: 'bg-purple-500/10 text-purple-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
  };

  const iconClass = colorClasses[color] || 'bg-primary/10 text-primary';

  return (
    <div className="p-6 rounded-lg border bg-card border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
          {subtext && <p className="text-xs mt-1 text-muted-foreground">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${iconClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function CustomerFeedback({ userRole = 'Agent', refreshTrigger = 0 }) {
  // Fetch feedback data only for agents
  const { data: feedbackData, isLoading, refetch } = useGetAgentFeedbackQuery();
  
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const feedback = feedbackData?.data || {};
  const trendData = feedback.trend || [];
  const recentFeedback = feedback.recentFeedback || [];
  const overallAverage = feedback.overallAverage || 0;
  const totalFeedbackCount = feedback.totalFeedbackCount || 0;

  // Rating distribution calculation
  const ratingCounts = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  recentFeedback.forEach((item) => {
    if (item.rating && ratingCounts.hasOwnProperty(item.rating)) {
      ratingCounts[item.rating]++;
    }
  });

  // Chart data for 7-day trend
  const trendChartData = {
    labels: trendData.map((d) => d.day),
    datasets: [
      {
        label: 'Average Rating',
        data: trendData.map((d) => d.avgRating || 0),
        borderColor: 'hsl(24.6 95% 53.1%)', // primary orange
        backgroundColor: 'hsla(24.6, 95%, 53.1%, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'hsl(24.6 95% 53.1%)',
        pointBorderColor: 'hsl(var(--card))',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  // Chart data for rating distribution
  const ratingChartData = {
    labels: ['5 ⭐ Excellent', '4 ⭐ Good', '3 ⭐ Average', '2 ⭐ Fair', '1 ⭐ Poor'],
    datasets: [
      {
        label: 'Feedback Count',
        data: [ratingCounts[5], ratingCounts[4], ratingCounts[3], ratingCounts[2], ratingCounts[1]],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  // Chart data for satisfaction pie
  const satisfactionData = {
    labels: ['Satisfied (4-5⭐)', 'Neutral (3⭐)', 'Unsatisfied (1-2⭐)'],
    datasets: [
      {
        label: 'Satisfaction Level',
        data: [
          ratingCounts[5] + ratingCounts[4],
          ratingCounts[3],
          ratingCounts[2] + ratingCounts[1],
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--muted-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'hsla(var(--border) / 0.1)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 11,
            weight: 500,
          },
        },
        grid: {
          display: false,
        },
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
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--muted-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-emerald-500';
    if (rating >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  const getRatingBgColor = (rating) => {
    if (rating >= 4) return 'bg-emerald-500/10';
    if (rating >= 3) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="p-2 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Customer Feedback
          </h2>
          <p className="text-sm mt-1 text-muted-foreground">
            {userRole === 'Agent'
              ? 'Your customer feedback and satisfaction metrics'
              : `Team-wide customer feedback and satisfaction`}
          </p>
        </div>

      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <FeedbackStatCard
          icon={Star}
          label="Overall Rating"
          value={`${overallAverage.toFixed(1)} ⭐`}
          color="yellow"
        />
        <FeedbackStatCard
          icon={MessageSquare}
          label="Total Feedback"
          value={totalFeedbackCount}
          color="blue"
        />
        <FeedbackStatCard
          icon={TrendingUp}
          label="Satisfied"
          value={ratingCounts[5] + ratingCounts[4]}
          color="green"
        />
        <FeedbackStatCard
          icon={Users}
          label="Unsatisfied"
          value={ratingCounts[2] + ratingCounts[1]}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Trend */}
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            Rating Trend (Last 7 Days)
          </h3>
          <div className="p-4 rounded-lg bg-muted/20" style={{ height: '300px' }}>
            {trendData.length > 0 ? (
              <Line data={trendChartData} options={commonOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No feedback data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            Rating Distribution
          </h3>
          <div className="p-4 rounded-lg bg-muted/20" style={{ height: '300px' }}>
            {totalFeedbackCount > 0 ? (
              <Bar data={ratingChartData} options={commonOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No feedback data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Satisfaction Level */}
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            Satisfaction Level
          </h3>
          <div className="p-4 rounded-lg bg-muted/20" style={{ height: '300px' }}>
            {totalFeedbackCount > 0 ? (
              <Doughnut data={satisfactionData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No feedback data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      {recentFeedback.length > 0 && (
        <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            Recent Feedback
          </h3>
          <div className="space-y-3">
            {recentFeedback.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border bg-muted/20 border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {item.customerName || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getRatingBgColor(
                      item.rating
                    )} ${getRatingColor(item.rating)}`}
                  >
                    {item.rating} ⭐
                  </div>
                </div>
                {item.comment && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {item.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
