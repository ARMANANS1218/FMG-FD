import React, { useState, useContext } from 'react';
import { CircularProgress } from '@mui/material';
import {
  ChevronDown,
  ChevronUp,
  Star,
  BarChart3,
} from 'lucide-react';
import { useGetAgentPerformanceListQuery } from '../../../features/admin/adminApi';
import ColorModeContext from '../../../context/ColorModeContext';

const PerformanceCard = ({ agent, stats, feedbackDetails, isDark }) => {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    break: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    offline: 'bg-muted text-foreground  dark:text-gray-200',
  };

  return (
    <div className="bg-card  rounded-xl shadow-lg border border-border  overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-6 cursor-pointer hover:bg-muted/50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground dark:text-blue-300">
                {agent.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">
                {agent.name}
              </h3>
              <p className="text-sm text-muted-foreground ">{agent.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[agent.status || 'offline']}`}>
              {agent.status || 'offline'}
            </span>
          </div>

          <div className="flex items-center gap-2 mr-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.avgFeedbackRating} ⭐
              </p>
              <p className="text-xs text-muted-foreground ">
                {stats.feedbackCount} reviews
              </p>
            </div>
            {expanded ? (
              <ChevronUp size={24} className="text-muted-foreground " />
            ) : (
              <ChevronDown size={24} className="text-muted-foreground " />
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 ">
              {stats.resolvedToday}
            </p>
            <p className="text-xs text-muted-foreground ">Resolved Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground ">
              {stats.activeChats}
            </p>
            <p className="text-xs text-muted-foreground ">Active Chats</p>
          </div>
          {/* Calls Today removed */}
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.emailsSent}
            </p>
            <p className="text-xs text-muted-foreground ">Emails Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.highPriorityQueries}
            </p>
            <p className="text-xs text-muted-foreground ">High Priority</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border  p-6 bg-muted/50 /50 space-y-6">
          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="p-2 bg-card  rounded-lg border border-border ">
              <p className="text-sm text-muted-foreground  font-semibold mb-1">
                Total Resolved Queries
              </p>
              <p className="text-3xl font-bold text-foreground ">
                {stats.totalResolved}
              </p>
            </div>

            <div className="p-2 bg-card  rounded-lg border border-border ">
              <p className="text-sm text-muted-foreground  font-semibold mb-1">
                Avg Response Time
              </p>
              <p className="text-3xl font-bold text-green-600 ">
                {stats.avgResponseTime}m
              </p>
            </div>

            {/* Total Call Duration removed */}
          </div>

          {/* Feedback Section */}
          {feedbackDetails && feedbackDetails.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Star size={18} className="text-yellow-600 dark:text-yellow-400" />
                Customer Feedback ({feedbackDetails.length})
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {feedbackDetails.map((feedback, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-card  rounded-lg border border-border "
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">
                        {feedback.customerName || 'Anonymous'}
                      </p>
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                        {feedback.feedbackRating} ⭐
                      </span>
                    </div>
                    {feedback.feedbackComment && (
                      <p className="text-sm text-muted-foreground ">
                        "{feedback.feedbackComment}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                      {new Date(feedback.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!feedbackDetails || feedbackDetails.length === 0) && (
            <div className="p-6 text-center bg-muted  rounded-lg">
              <p className="text-muted-foreground ">No customer feedback available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AgentPerformance = () => {
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';

  const { data: performanceData, isLoading } = useGetAgentPerformanceListQuery();
  const agents = performanceData?.data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-muted/50 ">
        <div className="text-center">
          <CircularProgress className="text-foreground  mb-4" />
          <p className="text-muted-foreground  mt-2">Loading agent performance data...</p>
        </div>
      </div>
    );
  }

  const totalResolvedToday = agents.reduce((sum, a) => sum + a.stats.resolvedToday, 0);
  // Calls removed from summary
  const avgRating = agents.length > 0 
    ? (agents.reduce((sum, a) => sum + a.stats.avgFeedbackRating, 0) / agents.length).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-2 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-foreground mb-2">
          Agent Performance
        </h1>
        <p className="text-muted-foreground ">
          Individual performance metrics and customer feedback for all agents
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card  rounded-xl p-6 shadow-lg border border-border ">
          <p className="text-sm text-muted-foreground  font-semibold mb-2">
            Total Agents
          </p>
          <p className="text-4xl font-bold text-foreground ">
            {agents.length}
          </p>
        </div>

        <div className="bg-card  rounded-xl p-6 shadow-lg border border-border ">
          <p className="text-sm text-muted-foreground  font-semibold mb-2">
            Avg Rating (Actual Data)
          </p>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
            {avgRating} ⭐
          </p>
        </div>

        <div className="bg-card  rounded-xl p-6 shadow-lg border border-border ">
          <p className="text-sm text-muted-foreground  font-semibold mb-2">
            Total Resolved Today
          </p>
          <p className="text-4xl font-bold text-green-600 ">
            {totalResolvedToday}
          </p>
        </div>

        {/* Total Calls Made Today removed */}
      </div>

      {/* Individual Agent Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <BarChart3 size={24} />
          Individual Agent Details
        </h2>
        {agents.length === 0 ? (
          <div className="p-8 text-center bg-card  rounded-xl border border-border ">
            <p className="text-muted-foreground ">No agents found.</p>
          </div>
        ) : (
          agents.map((agentData, idx) => (
            <PerformanceCard
              key={idx}
              agent={agentData.agent}
              stats={agentData.stats}
              feedbackDetails={agentData.feedbackDetails}
              isDark={isDark}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AgentPerformance;
