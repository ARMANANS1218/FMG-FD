import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
    useGetGdprRequestsQuery,
    useResolveGdprRequestMutation,
} from "@/features/customer/customerApi";
import {
    Search,
    CheckCircle,
    FileText,
    Trash2,
    Clock,
    Eye,
} from "lucide-react";

export default function GdprRequests() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Pending"); // 'Pending', 'Resolved', 'All'

    // Fetch the data from RTK Query
    const {
        data: response,
        isLoading,
        isFetching,
        refetch,
    } = useGetGdprRequestsQuery(activeTab);

    const [resolveGdprRequest, { isLoading: isResolving }] =
        useResolveGdprRequestMutation();

    // Normalize data so we can map each request (Deletion or SAR) to its own row
    const normalizedRequests = useMemo(() => {
        if (!response?.status || !response?.data) return [];
        const flattened = [];

        response.data.forEach((customer) => {
            if (customer.dataDeleteRequest) {
                flattened.push({
                    id: `${customer._id}-deletion`,
                    customerId: customer._id,
                    customerName: customer.name,
                    customerEmail: customer.email,
                    customerRef: customer.customerId,
                    requestType: "Deletion",
                    date: customer.dataDeleteRequestDate,
                    status: customer.dataDeleteRequestStatus || "Pending",
                });
            }
            if (customer.subjectAccessRequest) {
                flattened.push({
                    id: `${customer._id}-sar`,
                    customerId: customer._id,
                    customerName: customer.name,
                    customerEmail: customer.email,
                    customerRef: customer.customerId,
                    requestType: "SAR",
                    date: customer.subjectAccessRequestDate,
                    status: customer.subjectAccessRequestStatus || "Pending",
                });
            }
        });

        // Optionally filter out on the frontend just to be safe if 'All' brings in too much,
        // though the backend should handle the filtering.
        let filtered = flattened;
        if (activeTab !== "All") {
            filtered = flattened.filter((r) => r.status === activeTab);
        }

        // Sort by date newest first
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [response, activeTab]);

    const handleResolve = async (customerId, requestType) => {
        try {
            const res = await resolveGdprRequest({ id: customerId, requestType }).unwrap();
            if (res.status) {
                toast.success(res.message);
                refetch();
            } else {
                toast.error(res.message || "Failed to resolve request");
            }
        } catch (error) {
            toast.error(error.data?.message || "Failed to resolve request");
        }
    };

    const getStatusBadge = (status) => {
        if (status === "Resolved") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle size={14} />
                    Resolved
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                <Clock size={14} />
                Pending
            </span>
        );
    };

    const getTypeBadge = (type) => {
        if (type === "Deletion") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <Trash2 size={14} />
                    Account Deletion
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                <FileText size={14} />
                Subject Access (SAR)
            </span>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 pt-20 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        GDPR Requests Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage Data Deletion and Subject Access Requests from customers.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6">
                    <nav className="-mb-px flex gap-6">
                        {["Pending", "Resolved", "All"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                        ? "border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                    }`}
                            >
                                {tab} Requests
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Customer Details
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Request Type
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Request Date
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Status
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {(isLoading || isFetching) ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
                                            <p>Loading requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : normalizedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-lg font-medium">No requests found</p>
                                            <p className="text-sm">No {activeTab.toLowerCase()} GDPR requests match your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                normalizedRequests.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {req.customerName}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {req.customerEmail}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                    ID: {req.customerRef}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getTypeBadge(req.requestType)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {req.date ? format(new Date(req.date), "MMM dd, yyyy") : "N/A"}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {req.date ? format(new Date(req.date), "hh:mm a") : ""}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link
                                                    to={`/admin/customer/${req.customerId}`}
                                                    className="text-teal-600 hover:text-teal-900 dark:hover:text-teal-400 flex items-center gap-1"
                                                    title="View Profile"
                                                >
                                                    <Eye size={16} />
                                                    <span className="hidden sm:inline">Profile</span>
                                                </Link>
                                                {req.status === "Pending" && (
                                                    <button
                                                        onClick={() => handleResolve(req.customerId, req.requestType)}
                                                        disabled={isResolving}
                                                        className="text-green-600 hover:text-green-900 dark:hover:text-green-400 flex items-center gap-1 ml-2 disabled:opacity-50"
                                                        title="Mark as Resolved"
                                                    >
                                                        <CheckCircle size={16} />
                                                        <span className="hidden sm:inline">Resolve</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
