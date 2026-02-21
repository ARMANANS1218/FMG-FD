import React, { useState } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown, Star, CheckCircle, Schedule } from '@mui/icons-material';
import { useGetAllEmployeesQuery, useGetAdminDashboardStatsQuery } from '../../../../features/admin/adminApi';

const AgentsPerformance = () => {
  const { data: employeesData, isLoading: employeesLoading } = useGetAllEmployeesQuery();
  const { data: dashboardData, isLoading: dashboardLoading } = useGetAdminDashboardStatsQuery('all');
  const [sortBy, setSortBy] = useState('performance');

  const agents = employeesData?.data?.filter(emp => emp.role === 'Agent') || [];
  const agentPerformanceData = dashboardData?.data?.agent?.topAgents || [];

  // Merge employee data with performance data
  const agentsWithPerformance = agents.map(agent => {
    const perfData = agentPerformanceData.find(p => p.email === agent.email);
    return {
      ...agent,
      performance: {
        ticketsResolved: perfData?.totalResolved || 0,
        resolvedToday: perfData?.resolvedToday || 0,
        avgResponseTime: perfData?.avgResponseTime || 0,
        satisfaction: perfData?.avgFeedbackRating || 0,
        csatScore: perfData?.avgFeedbackRating ? Math.round((perfData.avgFeedbackRating / 5) * 100) : 0,
        activeChats: perfData?.activeChats || 0,
        callsMade: perfData?.callsMade || 0,
        emailsSent: perfData?.emailsSent || 0,
        successRate: perfData?.successRate || 0,
      }
    };
  });

  const getPerformanceColor = (satisfaction) => {
    if (satisfaction >= 4.5) return 'text-green-600 ';
    if (satisfaction >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceIcon = (satisfaction) => {
    if (satisfaction >= 4.5) return <TrendingUp className="text-green-600 " />;
    if (satisfaction >= 3.5) return <TrendingUp className="text-yellow-600 dark:text-yellow-400" />;
    return <TrendingDown className="text-red-600 dark:text-red-400" />;
  };

  if (employeesLoading || dashboardLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-foreground " />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Agents Performance
        </h1>
        <p className="text-muted-foreground ">
          Monitor and analyze agent performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground ">Total Agents</p>
              <h3 className="text-3xl font-bold text-foreground  mt-1">
                {agents.length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Star className="text-foreground " fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground ">Avg CSAT Score</p>
              <h3 className="text-3xl font-bold text-green-600  mt-1">
                {agentsWithPerformance.length > 0 
                  ? Math.round(agentsWithPerformance.reduce((acc, a) => acc + a.performance.csatScore, 0) / agentsWithPerformance.length)
                  : 0}%
              </h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="text-green-600 " fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground ">Total Tickets Resolved</p>
              <h3 className="text-3xl font-bold text-indigo-600  mt-1">
                {agentsWithPerformance.reduce((acc, a) => acc + a.performance.ticketsResolved, 0)}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <TrendingUp className="text-indigo-600 " fontSize="large" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card  border border-border  shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground ">Avg Response Time</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {agentsWithPerformance.length > 0 
                  ? (agentsWithPerformance.reduce((acc, a) => acc + parseFloat(a.performance.avgResponseTime || 0), 0) / agentsWithPerformance.length).toFixed(1)
                  : 0}m
              </h3>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Schedule className="text-amber-600 dark:text-amber-400" fontSize="large" />
            </div>
          </div>
        </div>
      </div>

      {/* Agents Performance Table */}
      <div className="rounded-lg bg-card  border border-border  shadow-sm overflow-hidden">
        <div className="p-2 border-b border-border ">
          <h2 className="text-xl font-semibold text-foreground">
            Agent Performance Details
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50  border-b border-border dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tickets Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  CSAT Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Active Chats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Calls Made
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {agentsWithPerformance.map((agent) => (
                <tr key={agent._id} className="hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={agent.profileImage}
                        alt={agent.name}
                        className="w-10 h-10 bg-card0"
                      >
                        {agent.name.charAt(0)}
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {agent.name}
                        </p>
                        <p className="text-sm text-muted-foreground ">
                          {agent.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agent.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 ' 
                        : 'bg-muted text-gray-800  '
                    }`}>
                      {agent.is_active ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-semibold">
                    {agent.performance.ticketsResolved}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {agent.performance.avgResponseTime} min
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getPerformanceIcon(agent.performance.satisfaction)}
                      <span className={`font-semibold ${getPerformanceColor(agent.performance.satisfaction)}`}>
                        {agent.performance.satisfaction.toFixed(1)}/5.0
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary/50 h-2 rounded-full"
                          style={{ width: `${agent.performance.csatScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold bg-primary ">
                        {agent.performance.csatScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-indigo-600 ">
                      {agent.performance.successRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {agent.performance.activeChats}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {agent.performance.callsMade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentsPerformance;
