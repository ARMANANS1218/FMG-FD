import React, { useState, useEffect } from "react";
import { useGetCasesQuery, useCreateCaseMutation } from "../../../features/case/caseApi";
import { useGetCustomerListQuery } from "../../../features/customer/customerApi";
import { useGetProductsQuery } from "../../../features/product/productApi";
import { Search, Plus, Eye, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import {
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
} from "@mui/material";

const CaseList = () => {
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [addDialog, setAddDialog] = useState(false);
    const [viewDialog, setViewDialog] = useState({ open: false, caseItem: null });

    const [formData, setFormData] = useState({
        customerId: "",
        productId: "",
        batchNumber: "",
        complaintCategory: "",
        subCategory: "",
        severityLevel: "Low",
        status: "Open",
    });

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // RTK Query Hooks
    const { data: casesData, isLoading, isFetching } = useGetCasesQuery({
        page,
        limit: itemsPerPage,
        search: debouncedQuery,
        status: statusFilter,
    });

    const { data: customersData } = useGetCustomerListQuery({ limit: 1000 });
    const { data: productsData } = useGetProductsQuery({ limit: 1000 });

    const [createCase, { isLoading: isCreating }] = useCreateCaseMutation();

    const cases = casesData?.data || [];
    const totalItems = casesData?.pagination?.totalItems || 0;
    const totalPages = casesData?.pagination?.totalPages || 1;
    const customers = customersData?.data || [];
    const products = productsData?.data || [];

    const handleOpenAdd = () => {
        setFormData({
            customerId: "",
            productId: "",
            batchNumber: "",
            complaintCategory: "",
            subCategory: "",
            severityLevel: "Low",
            status: "Open",
        });
        setAddDialog(true);
    };

    const handleCloseDialogs = () => {
        setAddDialog(false);
        setViewDialog({ open: false, caseItem: null });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveCase = async () => {
        try {
            if (!formData.customerId || !formData.productId) {
                toast.error("Customer and Product are required");
                return;
            }
            await createCase(formData).unwrap();
            toast.success("Case created successfully");
            handleCloseDialogs();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to create case");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getSeverityBadge = (severity) => {
        const colors = {
            Low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            High: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
            Critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
        return colors[severity] || colors.Low;
    };

    const getStatusBadge = (status) => {
        const colors = {
            Open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            Escalated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            Closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        };
        return colors[status] || colors.Open;
    };

    const loading = isLoading || isFetching;

    return (
        <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-card shadow-md p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search cases by ID or related entities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Pending">Pending</option>
                            <option value="Escalated">Escalated</option>
                            <option value="Closed">Closed</option>
                        </select>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground whitespace-nowrap">Show:</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={18} />
                        Add Case
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                        <CircularProgress size={40} className="text-primary" />
                    </div>
                )}

                {cases.length === 0 && !loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Briefcase size={64} className="mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">No Cases Found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery || statusFilter
                                    ? "No cases match your filters."
                                    : "No cases have been created yet."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto w-full">
                        <div className="bg-card w-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Case ID</th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Severity</th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {cases.map((c) => (
                                        <tr key={c._id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-primary">{c.caseId}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-foreground">{c.customerId?.name || "Unknown"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-foreground">{c.productId?.productName || "Unknown"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-muted-foreground">{c.complaintCategory || "N/A"}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadge(c.severityLevel)}`}>
                                                    {c.severityLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {formatDate(c.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Tooltip title="View Case">
                                                    <IconButton onClick={() => setViewDialog({ open: true, caseItem: c })} size="small" className="text-primary hover:bg-primary/10">
                                                        <Eye size={18} />
                                                    </IconButton>
                                                </Tooltip>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {cases.length > 0 && (
                    <div className="bg-card border-t border-border p-4 sticky bottom-0">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, totalItems)} of {totalItems} cases
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center px-4 font-medium text-foreground">
                                    Page {page} of {totalPages}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages || loading}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Case Dialog */}
            <Dialog open={addDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
                <DialogTitle className="bg-card text-foreground border-b border-border">
                    <div className="flex items-center gap-3">
                        <Briefcase size={24} className="text-primary" />
                        <span className="font-semibold">Create New Case</span>
                    </div>
                </DialogTitle>
                <DialogContent className="bg-card pt-6">
                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Customer <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="customerId"
                                    value={formData.customerId}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map((c) => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.customerId})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Product <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">Select Product</option>
                                    {products.map((p) => (
                                        <option key={p._id} value={p._id}>{p.productName} ({p.skuCode})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Complaint Category</label>
                                <input
                                    type="text"
                                    name="complaintCategory"
                                    value={formData.complaintCategory}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Quality Issue"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Sub Category</label>
                                <input
                                    type="text"
                                    name="subCategory"
                                    value={formData.subCategory}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Spoiled product"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Batch Number</label>
                                <input
                                    type="text"
                                    name="batchNumber"
                                    value={formData.batchNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Severity Level</label>
                                <select
                                    name="severityLevel"
                                    value={formData.severityLevel}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Open">Open</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions className="bg-card border-t border-border p-4">
                    <button onClick={handleCloseDialogs} className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveCase}
                        disabled={isCreating || !formData.customerId || !formData.productId}
                        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isCreating ? <CircularProgress size={16} color="inherit" /> : null}
                        Create Case
                    </button>
                </DialogActions>
            </Dialog>

            {/* View Case Dialog */}
            <Dialog open={viewDialog.open} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
                <DialogTitle className="bg-card text-foreground border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Briefcase size={24} className="text-primary" />
                            <span className="font-semibold">Case Details</span>
                        </div>
                        {viewDialog.caseItem && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(viewDialog.caseItem.status)}`}>
                                {viewDialog.caseItem.status}
                            </span>
                        )}
                    </div>
                </DialogTitle>
                <DialogContent className="bg-card pt-6">
                    {viewDialog.caseItem && (
                        <div className="space-y-4 font-medium text-sm text-foreground">
                            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                                <div>
                                    <span className="text-muted-foreground block text-xs">Case ID</span>
                                    <span className="font-mono text-primary">{viewDialog.caseItem.caseId}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Severity</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium ${getSeverityBadge(viewDialog.caseItem.severityLevel)}`}>
                                        {viewDialog.caseItem.severityLevel}
                                    </span>
                                </div>
                            </div>

                            <div className="border border-border p-4 rounded-lg">
                                <h4 className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Involved Entities</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Customer</span>
                                        <span>{viewDialog.caseItem.customerId?.name || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Product</span>
                                        <span>{viewDialog.caseItem.productId?.productName || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-border p-4 rounded-lg">
                                <h4 className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Complaint Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Category</span>
                                        <span>{viewDialog.caseItem.complaintCategory || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Sub Category</span>
                                        <span>{viewDialog.caseItem.subCategory || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Batch Number</span>
                                        <span>{viewDialog.caseItem.batchNumber || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Created At</span>
                                        <span>{formatDate(viewDialog.caseItem.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
                <DialogActions className="bg-card border-t border-border p-4">
                    <button onClick={handleCloseDialogs} className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">
                        Close
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default CaseList;
