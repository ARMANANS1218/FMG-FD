// src/features/product/productApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:6010';

export const productApi = createApi({
    reducerPath: 'productApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_URL}/api/v1/products`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Product', 'ProductList'],
    endpoints: (builder) => ({
        getProducts: builder.query({
            query: (params) => ({
                url: '/',
                params, // Support search & filter query params
            }),
            providesTags: ['ProductList'],
        }),

        getProductById: builder.query({
            query: (id) => `/${id}`,
            providesTags: (result, error, id) => [{ type: 'Product', id }],
        }),

        createProduct: builder.mutation({
            query: (productData) => ({
                url: '/',
                method: 'POST',
                body: productData,
            }),
            invalidatesTags: ['ProductList'],
        }),

        bulkImportProducts: builder.mutation({
            query: (productsData) => ({
                url: '/bulk',
                method: 'POST',
                body: productsData,
            }),
            invalidatesTags: ['ProductList'],
        }),

        updateProduct: builder.mutation({
            query: ({ id, data }) => ({
                url: `/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, 'ProductList'],
        }),

        deleteProduct: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ProductList'],
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductByIdQuery,
    useCreateProductMutation,
    useBulkImportProductsMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productApi;
