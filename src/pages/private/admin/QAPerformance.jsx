import React, { useState, useContext } from 'react';
import { CircularProgress } from '@mui/material';
import {
  ChevronDown,
  ChevronUp,
  Star,
  BarChart3,
  ThumbsUp,
} from 'lucide-react';
import { useGetQAPerformanceListQuery } from '../../../features/admin/adminApi';
import ColorModeContext from '../../../context/ColorModeContext';

const QAPerformanceCard = ({ qa, stats, feedbackDetails, isDark }) => {
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
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-300">
                {qa.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">
                {qa.name}
              </h3>
              <p className="text-sm text-muted-foreground ">{qa.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[qa.status || 'offline']}`}>
              {qa.status || 'offline'}
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
              {stats.approvedToday}
            </p>
            <p className="text-xs text-muted-foreground ">Approved Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.rejectedToday}
            </p>
            <p className="text-xs text-muted-foreground ">Rejected Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.pendingReviews}
            </p>
            <p className="text-xs text-muted-foreground ">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground ">
              {stats.approvalRate}%
            </p>
            <p className="text-xs text-muted-foreground ">Approval Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.escalationsHandled}
            </p>
            <p className="text-xs text-muted-foreground ">Escalations</p>
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
                Total Tickets Reviewed
              </p>
              <p className="text-3xl font-bold text-foreground ">
                {stats.ticketsReviewed}
              </p>
            </div>

            <div className="p-2 bg-card  rounded-lg border border-border ">
              <p className="text-sm text-muted-foreground  font-semibold mb-1">
                Avg Review Time
              </p>
              <p className="text-3xl font-bold text-green-600 ">
                {stats.avgReviewTime}m
              </p>
            </div>

            <div className="p-2 bg-card  rounded-lg border border-border ">
              <p className="text-sm text-muted-foreground  font-semibold mb-1">
                Total Escalations
              </p>
              <p className="text-3xl font-bold text-indigo-600 ">
                {stats.escalationsHandled}
              </p>
            </div>
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

const QAPerformance = () => {
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';

  const { data: performanceData, isLoading } = useGetQAPerformanceListQuery();
  const qaMembers = performanceData?.data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-muted/50 ">
        <div className="text-center">
          <CircularProgress className="text-amber-600 dark:text-amber-400 mb-4" />
          <p className="text-muted-foreground  mt-2">Loading QA performance data...</p>
        </div>
      </div>
    );
  }

  const totalApprovedToday = qaMembers.reduce((sum, q) => sum + q.stats.approvedToday, 0);
  const totalRejectedToday = qaMembers.reduce((sum, q) => sum + q.stats.rejectedToday, 0);
  const avgApprovalRate = qaMembers.length > 0 
    ? (qaMembers.reduce((sum, q) => sum + q.stats.approvalRate, 0) / qaMembers.length).toFixed(1)
    : 0;
  const avgRating = qaMembers.length > 0 
    ? (qaMembers.reduce((sum, q) => sum + q.stats.avgFeedbackRating, 0) / qaMembers.length).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-2 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-foreground mb-2">
          QA Team Performance
        </h1>
        <p className="text-muted-foreground ">
          Individual performance metrics and customer feedback for all QA members
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card  rounded-xl p-6 shadow-lg border border-border ">
          <p className="text-sm text-muted-foreground  font-semibold mb-2">
            Total QA Members
          </p>
          <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">
            {qaMembers.length}
          </p>
        </div>

        <div className="bg-card  rounded-xl p-6 shadow-lg border border-border ">
          <p className="text-sm text-muted-foreground  font-semibold mb-2">
            Avg Approval Rate (Actual Data)
          </p>
          <p className="text-4xl font-bold text-green-600 ">
            {avgApprovalRate}%
          </p>
        </div>

        <div className="bg-card  rounded-xl p-6 shadow-lg border border-border ">
          <p className="text-sm text-muted-foreground  font-semibold mb-2">
            Total Approved Today
          </p>
          <p className="text-4xl font-bold text-green-600 ">
            {totalApprovedToday}
          </p>
        </div>

        <div className="bg-card  rounded-xl p-6 shadow-lg border border-border ">
          <p className="text-sm text-muted-foreground  font-semibold mb-2">
            Avg Feedback Rating (Actual Data)
          </p>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
            {avgRating} ⭐
          </p>
        </div>
      </div>

      {/* Individual QA Member Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <BarChart3 size={24} />
          Individual QA Member Details
        </h2>
        {qaMembers.length === 0 ? (
          <div className="p-8 text-center bg-card  rounded-xl border border-border ">
            <p className="text-muted-foreground ">No QA members found.</p>
          </div>
        ) : (
          qaMembers.map((qaData, idx) => (
            <QAPerformanceCard
              key={idx}
              qa={qaData.qa}
              stats={qaData.stats}
              feedbackDetails={qaData.feedbackDetails}
              isDark={isDark}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default QAPerformance;
