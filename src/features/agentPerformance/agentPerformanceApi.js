import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const agentPerformanceApi = createApi({
  reducerPath: 'agentPerformanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/agent-performance`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['AgentPerformance'],

  endpoints: (builder) => ({
    // Get agent performance with stats (queries + tickets)
    getAgentPerformance: builder.query({
      query: ({ agentId, startDate, endDate, role } = {}) => ({
        url: '/performance',
        params: { agentId, startDate, endDate, role },
      }),
      providesTags: ['AgentPerformance'],
    }),

    // Get all raw data for export (PDF/Excel)
    getAllPerformanceData: builder.query({
      query: () => '/performance/all-data',
      providesTags: ['AgentPerformance'],
    }),
  }),
});

export const {
  useGetAgentPerformanceQuery,
  useGetAllPerformanceDataQuery,
} = agentPerformanceApi;
