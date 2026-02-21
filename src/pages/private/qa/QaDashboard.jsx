import React, { useState } from 'react';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import { useGetDashboardStatsQuery, useGetWeeklyPerformanceQuery } from '../../../features/dashboard/dashboardApi';
import EnhancedDashboard from '../../../components/Dashboard/EnhancedDashboard';
import TicketStats from '../../../components/Dashboard/TicketStats';
import CustomerFeedback from '../../../components/Dashboard/CustomerFeedback';
import DashboardSkeleton from '../../../components/Skeletons/DashboardSkeleton';
import { BarChart3, Mail, MessageSquare } from 'lucide-react';

const QaDashboard = () => {
  const [activeTab, setActiveTab] = useState('query-stats');
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useGetDashboardStatsQuery();
  const { data: weeklyData, isLoading: weeklyLoading, refetch: refetchWeekly } = useGetWeeklyPerformanceQuery();

  const isLoading = profileLoading || statsLoading || weeklyLoading;

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchWeekly()]);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (statsError) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-red-600 dark:text-red-400">Failed to load dashboard statistics</div>
      </div>
    );
  }

  // Get real dashboard stats from API
  const dashboardStats = statsData?.data || {};
  const userRole = profileData?.data?.role === 'TL' ? 'TL' : 'QA';

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-border dark:border-gray-800 bg-card ">
        <div className="px-4 md:px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('query-stats')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'query-stats'
                  ? 'border-blue-600 text-foreground dark:border-blue-400 '
                  : 'border-transparent text-muted-foreground  hover:text-foreground dark:hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Query Stats
            </button>
            <button
              onClick={() => setActiveTab('ticket-stats')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'ticket-stats'
                  ? 'border-blue-600 text-foreground dark:border-blue-400 '
                  : 'border-transparent text-muted-foreground  hover:text-foreground dark:hover:text-gray-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              Ticket Stats
            </button>
            <button
              onClick={() => setActiveTab('customer-feedback')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'customer-feedback'
                  ? 'border-blue-600 text-foreground dark:border-blue-400 '
                  : 'border-transparent text-muted-foreground  hover:text-foreground dark:hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Customer Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'query-stats' && (
          <EnhancedDashboard 
            userRole={userRole}
            dashboardStats={dashboardStats}
            weeklyData={weeklyData?.data || []}
            onRefresh={handleRefresh}
          />
        )}
        {activeTab === 'ticket-stats' && (
          <TicketStats 
            userRole={userRole} 
            reviewMetrics={dashboardStats?.qaReviewMetrics?.ticket}
          />
        )}
        {activeTab === 'customer-feedback' && (
          <CustomerFeedback userRole={userRole} />
        )}
      </div>
    </div>
  );
};

export default QaDashboard;