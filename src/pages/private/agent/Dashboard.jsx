import React, { useState } from 'react';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import {
  useGetDashboardStatsQuery,
  useGetWeeklyPerformanceQuery,
} from '../../../features/dashboard/dashboardApi';
import { CircularProgress } from '@mui/material';
import EnhancedDashboard from '../../../components/Dashboard/EnhancedDashboard';
import TicketStats from '../../../components/Dashboard/TicketStats';
import CustomerFeedback from '../../../components/Dashboard/CustomerFeedback';
import DashboardSkeleton from '../../../components/Skeletons/DashboardSkeleton';
import { BarChart3, Mail, MessageSquare, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('query-stats');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useGetDashboardStatsQuery();
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    refetch: refetchWeekly,
  } = useGetWeeklyPerformanceQuery();

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'query-stats') {
      await Promise.all([refetchStats(), refetchWeekly()]);
    } else {
      setRefreshTrigger((prev) => prev + 1);
      // Simulate network delay for UI feedback as we can't await the child's refetch easily
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    setIsRefreshing(false);
  };

  const isLoading = profileLoading || statsLoading || weeklyLoading;

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

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-border bg-card ">
        <div className="px-4 md:px-6 flex justify-between items-center">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('query-stats')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'query-stats'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Query Stats
            </button>
            <button
              onClick={() => setActiveTab('ticket-stats')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'ticket-stats'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-4 h-4" />
              Ticket Stats
            </button>
            <button
              onClick={() => setActiveTab('customer-feedback')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'customer-feedback'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Customer Feedback
            </button>
          </div>
          
          <button
            onClick={handleGlobalRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'query-stats' && (
          <EnhancedDashboard
            userRole="Agent"
            dashboardStats={dashboardStats}
            weeklyData={weeklyData?.data || []}
          />
        )}
        {activeTab === 'ticket-stats' && <TicketStats userRole="Agent" refreshTrigger={refreshTrigger} />}
        {activeTab === 'customer-feedback' && <CustomerFeedback userRole="Agent" refreshTrigger={refreshTrigger} />}
      </div>
    </div>
  );
};

export default Dashboard;
