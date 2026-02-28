// src/features/customer/customerApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:6010';

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1/customer`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['CustomerProfile'],
  endpoints: (builder) => ({
    // Get customer profile
    getCustomerProfile: builder.query({
      query: () => '/profile',
      providesTags: ['CustomerProfile'],
    }),

    // Update customer profile
    updateCustomerProfile: builder.mutation({
      query: (formData) => ({
        url: '/profile-update',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['CustomerProfile', 'CustomerList', 'CustomerDetail'],
    }),

    // Register customer
    registerCustomer: builder.mutation({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // Login customer
    loginCustomer: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Find customer by query ID
    findCustomerByQuery: builder.query({
      query: (queryId) => `/find-by-query/${queryId}`,
    }),

    // Update customer profile image
    updateCustomerProfileImage: builder.mutation({
      query: ({ customerId, imageUrl }) => ({
        url: '/update-profile-image',
        method: 'PUT',
        body: { customerId, imageUrl },
      }),
      invalidatesTags: ['CustomerProfile', 'CustomerList', 'CustomerDetail'],
    }),

    // GET ALL CUSTOMERS (Public/Unfiltered for general use)
    getCustomers: builder.query({
      query: () => '/',
      providesTags: ['CustomerList'],
    }),

    // CREATE CUSTOMER (Agent/TL/QA)
    createCustomer: builder.mutation({
      query: (customerData) => ({
        url: '/create',
        method: 'POST',
        body: customerData,
      }),
      invalidatesTags: ['CustomerList'],
    }),

    // SEARCH CUSTOMERS
    searchCustomers: builder.query({
      query: (queryParams) => ({
        url: '/search',
        params: queryParams,
      }),
      providesTags: ['CustomerList'],
    }),

    // GET CUSTOMER LIST
    getCustomerList: builder.query({
      query: (queryParams) => ({
        url: '/list',
        params: queryParams,
      }),
      providesTags: ['CustomerList'],
    }),

    // GET GDPR REQUESTS
    getGdprRequests: builder.query({
      query: (status = 'All') => `/gdpr/requests?status=${status}`,
      providesTags: ['GdprRequests'],
    }),

    // RESOLVE GDPR REQUEST
    resolveGdprRequest: builder.mutation({
      query: ({ id, requestType }) => ({
        url: `/gdpr/${id}/resolve`,
        method: 'PUT',
        body: { requestType },
      }),
      invalidatesTags: ['GdprRequests'],
    }),

    // GET CUSTOMER BY ID
    getCustomerById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'CustomerDetail', id }],
    }),

    // UPDATE CUSTOMER DETAILS (By ID)
    updateCustomerDetails: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CustomerDetail', id },
        'CustomerList'
      ],
    }),

    // DELETE CUSTOMER (By ID)
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CustomerList'],
    }),

    // GDPR COMPLIANCE (ID-based)
    requestDataDeletion: builder.mutation({
      query: (id) => ({
        url: `/${id}/gdpr/delete-request`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'CustomerDetail', id }, 'GdprRequests'],
    }),

    requestSubjectAccess: builder.mutation({
      query: (id) => ({
        url: `/${id}/gdpr/sar`,
        method: 'POST',
      }),
    }),

    updateConsent: builder.mutation({
      query: ({ id, consentData }) => ({
        url: `/${id}/consent`,
        method: 'PUT',
        body: consentData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CustomerDetail', id }],
    }),

    // ADD QUERY TO CUSTOMER
    addQueryToCustomer: builder.mutation({
      query: (queryData) => ({
        url: '/add-query',
        method: 'POST',
        body: queryData,
      }),
      invalidatesTags: ['CustomerQueries'],
    }),

    // GET CUSTOMER QUERY HISTORY
    getCustomerQueryHistory: builder.query({
      query: (customerId) => `/${customerId}/query-history`,
      providesTags: ['CustomerQueries'],
    }),
  }),
});

export const {
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
  useRegisterCustomerMutation,
  useLoginCustomerMutation,
  useFindCustomerByQueryQuery,
  useUpdateCustomerProfileImageMutation,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useSearchCustomersQuery,
  useGetCustomerListQuery,
  useGetGdprRequestsQuery,
  useResolveGdprRequestMutation,
  useGetCustomerByIdQuery,
  useUpdateCustomerDetailsMutation,
  useDeleteCustomerMutation,
  useRequestDataDeletionMutation,
  useRequestSubjectAccessMutation,
  useUpdateConsentMutation,
  useAddQueryToCustomerMutation,
  useGetCustomerQueryHistoryQuery,
} = customerApi;

