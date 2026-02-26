import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const fmcgReportingApi = createApi({
    reducerPath: 'fmcgReportingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_URL}/api/v1/fmcg-reports`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) headers.set('Authorization', `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ['FmcgReport'],
    endpoints: (builder) => ({
        // 1. Daily Operations Report
        getDailyOpsReport: builder.query({
            query: ({ organizationId, date } = {}) => ({
                url: '/daily-ops',
                params: { organizationId, date },
            }),
            providesTags: ['FmcgReport'],
        }),

        // 2. Weekly Quality Report
        getWeeklyQualityReport: builder.query({
            query: ({ organizationId, weekStart } = {}) => ({
                url: '/weekly-quality',
                params: { organizationId, weekStart },
            }),
            providesTags: ['FmcgReport'],
        }),

        // 3. Refund & Compensation Report
        getRefundReport: builder.query({
            query: ({ organizationId, startDate, endDate } = {}) => ({
                url: '/refunds',
                params: { organizationId, startDate, endDate },
            }),
            providesTags: ['FmcgReport'],
        }),

        // 4. Batch Issue Trend Report
        getBatchTrendReport: builder.query({
            query: ({ organizationId } = {}) => ({
                url: '/batch-trends',
                params: { organizationId },
            }),
            providesTags: ['FmcgReport'],
        }),

        // 5. Monthly Performance Review
        getMonthlyPerformanceReview: builder.query({
            query: ({ organizationId, month, year } = {}) => ({
                url: '/mpr',
                params: { organizationId, month, year },
            }),
            providesTags: ['FmcgReport'],
        }),

        // 6. Regulatory Compliance Report
        getRegulatoryReport: builder.query({
            query: ({ organizationId } = {}) => ({
                url: '/regulatory',
                params: { organizationId },
            }),
            providesTags: ['FmcgReport'],
        }),

        // 7. Workforce Productivity Report
        getProductivityReport: builder.query({
            query: ({ organizationId, startDate, endDate } = {}) => ({
                url: '/productivity',
                params: { organizationId, startDate, endDate },
            }),
            providesTags: ['FmcgReport'],
        }),

        // 8. Root Cause Analysis
        getRootCauseReport: builder.query({
            query: ({ organizationId } = {}) => ({
                url: '/root-cause',
                params: { organizationId },
            }),
            providesTags: ['FmcgReport'],
        }),
    }),
});

export const {
    useGetDailyOpsReportQuery,
    useGetWeeklyQualityReportQuery,
    useGetRefundReportQuery,
    useGetBatchTrendReportQuery,
    useGetMonthlyPerformanceReviewQuery,
    useGetRegulatoryReportQuery,
    useGetProductivityReportQuery,
    useGetRootCauseReportQuery,
} = fmcgReportingApi;
