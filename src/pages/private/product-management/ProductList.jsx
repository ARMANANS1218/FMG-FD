import React, { useState, useEffect } from "react";
import {
    useGetProductsQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} from "../../../features/product/productApi";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Package,
    FileSpreadsheet,
} from "lucide-react";
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

const ProductList = () => {
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const [addDialog, setAddDialog] = useState(false);
    const [editDialog, setEditDialog] = useState({ open: false, product: null });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

    const [formData, setFormData] = useState({
        productName: "",
        brand: "",
        skuCode: "",
        category: "Food",
        isActive: true,
    });

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // RTK Query Hooks
    const {
        data: productsData,
        isLoading,
        isFetching,
        refetch,
    } = useGetProductsQuery({
        page,
        limit: itemsPerPage,
        search: debouncedQuery,
    });

    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
    const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

    const products = productsData?.data || [];
    const totalItems = productsData?.pagination?.totalItems || 0;
    const totalPages = productsData?.pagination?.totalPages || 1;

    const handleOpenAdd = () => {
        setFormData({
            productName: "",
            brand: "",
            skuCode: "",
            category: "Food",
            isActive: true,
        });
        setAddDialog(true);
    };

    const handleOpenEdit = (product) => {
        setFormData({
            productName: product.productName,
            brand: product.brand,
            skuCode: product.skuCode,
            category: product.category,
            isActive: product.isActive,
        });
        setEditDialog({ open: true, product });
    };

    const handleCloseDialogs = () => {
        setAddDialog(false);
        setEditDialog({ open: false, product: null });
        setDeleteDialog({ open: false, id: null });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSaveProduct = async () => {
        try {
            if (editDialog.open) {
                await updateProduct({
                    id: editDialog.product._id,
                    data: formData,
                }).unwrap();
                toast.success("Product updated successfully");
            } else {
                await createProduct(formData).unwrap();
                toast.success("Product created successfully");
            }
            handleCloseDialogs();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to save product");
        }
    };

    const confirmDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await deleteProduct(deleteDialog.id).unwrap();
            toast.success("Product deleted successfully");
            handleCloseDialogs();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete product");
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
                                placeholder="Search products by name, brand, or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground whitespace-nowrap">
                                Show:
                            </label>
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
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { }}
                            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            <FileSpreadsheet size={18} />
                            Import Bulk
                        </button>
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            <Plus size={18} />
                            Add Product
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                        <CircularProgress size={40} className="text-primary" />
                    </div>
                )}

                {products.length === 0 && !loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Package size={64} className="mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                No Products Found
                            </h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? `No products match your search: "${searchQuery}"`
                                    : "No products have been added yet."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto w-full">
                        <div className="bg-card w-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Product Name
                                        </th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            SKU Code
                                        </th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Brand
                                        </th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {products.map((product) => (
                                        <tr
                                            key={product._id}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-foreground">
                                                    {product.productName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                    {product.skuCode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-foreground text-sm">
                                                {product.brand}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm border border-border px-2 py-1 rounded-full text-muted-foreground bg-card">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                        }`}
                                                >
                                                    {product.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {formatDate(product.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Tooltip title="Edit Product">
                                                        <IconButton
                                                            onClick={() => handleOpenEdit(product)}
                                                            size="small"
                                                            className="text-primary hover:bg-primary/10"
                                                        >
                                                            <Edit size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Product">
                                                        <IconButton
                                                            onClick={() =>
                                                                setDeleteDialog({ open: true, id: product._id })
                                                            }
                                                            size="small"
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {products.length > 0 && (
                    <div className="bg-card border-t border-border p-4 sticky bottom-0">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {(page - 1) * itemsPerPage + 1} to{" "}
                                {Math.min(page * itemsPerPage, totalItems)} of {totalItems}{" "}
                                products
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

            {/* Add / Edit Dialog */}
            <Dialog
                open={addDialog || editDialog.open}
                onClose={handleCloseDialogs}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="bg-card text-foreground border-b border-border">
                    <div className="flex items-center gap-3">
                        <Package size={24} className="text-primary" />
                        <span className="font-semibold">
                            {editDialog.open ? "Edit Product" : "Add New Product"}
                        </span>
                    </div>
                </DialogTitle>
                <DialogContent className="bg-card pt-6">
                    <div className="space-y-4 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="productName"
                                value={formData.productName}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter product name"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    SKU Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="skuCode"
                                    value={formData.skuCode}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. PRD-001"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Brand <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter brand name"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="Food">Food</option>
                                <option value="Beverage">Beverage</option>
                                <option value="Personal Care">Personal Care</option>
                                <option value="Household">Household</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                            />
                            <label
                                htmlFor="isActive"
                                className="text-sm font-medium text-foreground cursor-pointer"
                            >
                                Product is active and available
                            </label>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions className="bg-card border-t border-border p-4">
                    <button
                        onClick={handleCloseDialogs}
                        className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveProduct}
                        disabled={
                            isCreating ||
                            isUpdating ||
                            !formData.productName ||
                            !formData.skuCode ||
                            !formData.brand
                        }
                        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isCreating || isUpdating ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : null}
                        {editDialog.open ? "Save Changes" : "Create Product"}
                    </button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            {deleteDialog.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-card rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 border border-border">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Delete Product
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Are you sure you want to delete this product? This action cannot
                                be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={handleCloseDialogs}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg flex justify-center items-center hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <CircularProgress size={18} color="inherit" />
                                    ) : (
                                        "Delete"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
