import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:6010',
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token || localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const invoiceApi = createApi({
  reducerPath: 'invoiceApi',
  baseQuery,
  tagTypes: ['Invoice'],
  endpoints: (builder) => ({
    // Generate/save invoice (Admin)
    generateInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: '/api/v1/invoices/generate',
        method: 'POST',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Publish invoice (Admin)
    publishInvoice: builder.mutation({
      query: (id) => ({
        url: `/api/v1/invoices/${id}/publish`,
        method: 'PUT',
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Unpublish invoice (Admin)
    unpublishInvoice: builder.mutation({
      query: (id) => ({
        url: `/api/v1/invoices/${id}/unpublish`,
        method: 'PUT',
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Get invoice by month/year (Admin)
    getInvoiceByMonth: builder.query({
      query: ({ month, year }) => `/api/v1/invoices/${month}/${year}`,
      providesTags: ['Invoice'],
    }),

    // Get all invoices (Admin)
    getAllInvoices: builder.query({
      query: () => '/api/v1/invoices/all',
      providesTags: ['Invoice'],
    }),

    // Get published invoice for Management
    getInvoiceForManagement: builder.query({
      query: ({ month, year }) => `/api/v1/invoices/management?month=${month}&year=${year}`,
      providesTags: ['Invoice'],
    }),
  }),
});

export const {
  useGenerateInvoiceMutation,
  usePublishInvoiceMutation,
  useUnpublishInvoiceMutation,
  useGetInvoiceByMonthQuery,
  useGetAllInvoicesQuery,
  useGetInvoiceForManagementQuery,
} = invoiceApi;
