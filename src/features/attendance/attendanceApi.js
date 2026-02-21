import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token || localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery,
  tagTypes: ['Attendance'],
  endpoints: (builder) => ({
    // Get all attendance for a specific date
    getAllAttendance: builder.query({
      query: ({ date }) => ({
        url: '/api/v1/attendance/all',
        params: { date },
      }),
      providesTags: ['Attendance'],
    }),

    // Check-in
    checkIn: builder.mutation({
      query: (data) => ({
        url: '/api/v1/attendance/check-in',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // Check-out
    checkOut: builder.mutation({
      query: (data) => ({
        url: '/api/v1/attendance/check-out',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // Get my today's attendance
    getMyTodayAttendance: builder.query({
      query: () => '/api/v1/attendance/today',
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useGetAllAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useGetMyTodayAttendanceQuery,
} = attendanceApi;
