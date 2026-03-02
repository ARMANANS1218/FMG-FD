// src/features/case/caseApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:6010';

export const caseApi = createApi({
    reducerPath: 'caseApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_URL}/api/v1/cases`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Case', 'CaseList'],
    endpoints: (builder) => ({
        getCases: builder.query({
            query: (params) => ({
                url: '/',
                params, // support query params if any
            }),
            providesTags: ['CaseList'],
        }),

        createCase: builder.mutation({
            query: (caseData) => ({
                url: '/create',
                method: 'POST',
                body: caseData,
            }),
            invalidatesTags: ['CaseList'],
        }),
    }),
});

export const {
    useGetCasesQuery,
    useCreateCaseMutation,
} = caseApi;
