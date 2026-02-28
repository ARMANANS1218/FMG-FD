import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip } from '@mui/material';
import { Search, Eye, Phone, Mail, MapPin, Calendar, UserCog, Edit, User, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetCustomerListQuery, useSearchCustomersQuery, useDeleteCustomerMutation, useUpdateCustomerDetailsMutation } from '../../../features/customer/customerApi';

const CustomerList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [viewDialog, setViewDialog] = useState({ open: false, customer: null });
  const [editDialog, setEditDialog] = useState({ open: false, customer: null });
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // RTK Query Hooks
  const isSearchMode = debouncedQuery.trim().length >= 2;

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch: refetchList
  } = useGetCustomerListQuery(
    { page, limit: itemsPerPage },
    { skip: isSearchMode }
  );

  const {
    data: searchData,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
    refetch: refetchSearch
  } = useSearchCustomersQuery(
    { q: debouncedQuery },
    { skip: !isSearchMode }
  );

  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerDetailsMutation();

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (!searchQuery) {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Derived state
  const loading = isListLoading || isListFetching || isSearchLoading || isSearchFetching;
  const saving = isUpdating;

  let customers = [];
  let totalCustomers = 0;

  if (isSearchMode) {
    customers = searchData?.data || searchData?.customers || [];
    totalCustomers = searchData?.data?.length || searchData?.customers?.length || 0;
  } else {
    customers = listData?.data || [];
    totalCustomers = listData?.total || 0;
  }

  const totalPages = Math.ceil(totalCustomers / itemsPerPage);

  const handleViewCustomer = (customer) => {
    navigate(`${customer._id}`);
  };

  const handleRowClick = (customer) => {
    navigate(`${customer._id}`);
  };

  const handleDeleteCustomer = (customerId, e) => {
    e.stopPropagation(); // Prevent row click
    setCustomerToDelete(customerId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete).unwrap();
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error(error.data?.message || 'Failed to delete customer');
    } finally {
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editDialog.customer) return;

    try {
      await updateCustomer({ id: editDialog.customer._id, data: editDialog.customer }).unwrap();
      toast.success('Customer updated successfully');
      setEditDialog({ open: false, customer: null });
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error(error.data?.message || 'Failed to update customer');
    }
  };

  const handleEditFieldChange = (field, value, nestedField = null) => {
    setEditDialog(prev => {
      if (nestedField) {
        // Handle nested object updates (e.g., address.city, governmentId.number)
        return {
          ...prev,
          customer: {
            ...prev.customer,
            [field]: {
              ...prev.customer[field],
              [nestedField]: value
            }
          }
        };
      }
      // Handle simple field updates
      return {
        ...prev,
        customer: {
          ...prev.customer,
          [field]: value
        }
      };
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen w-full bg-background  flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card  shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 w-full">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Items per page selector */}
              {!isSearchMode && (
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
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  if (isSearchMode) {
                    refetchSearch();
                  } else {
                    refetchList();
                  }
                  setTimeout(() => setIsRefreshing(false), 500);
                }}
                disabled={isRefreshing}
                className="p-2 border border-border dark:border-gray-600 rounded-lg hover:bg-muted dark:hover:bg-gray-700 text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh List"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CircularProgress size={20} className="text-primary" />
            </div>
          )}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Empty State */}
          {customers.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <UserCog size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {isSearchMode ? 'No Customers Found' : 'No Customers Yet'}
                </h3>
                <p className="text-muted-foreground ">
                  {isSearchMode
                    ? `No customers match your search: "${searchQuery}"`
                    : 'No customers in your organization yet'}
                </p>
              </div>
            </div>
          ) : customers.length > 0 ? (
            <>
              {/* Customer List Table */}
              <div className="bg-card ">
                <table className="w-full">
                  <thead className="bg-muted/50  sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Customer ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {customers.map((customer) => (
                      <tr
                        key={customer._id}
                        onClick={() => handleRowClick(customer)}
                        className="hover:bg-muted/50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {
                              customer.profileImage ? (
                                <img
                                  src={customer.profileImage}
                                  alt={customer.name}
                                  className="w-9 h-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                  {customer.name?.charAt(0).toUpperCase() || 'C'}
                                </div>
                              )
                            }
                            <div>
                              <div className="font-medium text-foreground">
                                {customer.name || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-mono">
                            {customer.customerId || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground ">
                            <Mail size={14} className="flex-shrink-0" />
                            <span className="truncate max-w-xs">{customer.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground ">
                            <Phone size={14} className="flex-shrink-0" />
                            <span>{customer.mobile || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.address?.city ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground ">
                              <MapPin size={14} className="flex-shrink-0" />
                              <span className="truncate max-w-xs">
                                {customer.address.city}, {customer.address.country}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.serviceStatus && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                              ${customer.serviceStatus === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                customer.serviceStatus === 'Inactive' ? 'bg-muted text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                  customer.serviceStatus === 'Suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}
                            >
                              {customer.serviceStatus}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.createdBy ? (
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {customer.createdBy.name}
                                </p>
                                <p className="text-xs text-muted-foreground ">
                                  {customer.createdBy.role}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unknown</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground ">
                            <Calendar size={14} className="flex-shrink-0" />
                            <span>{formatDate(customer.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Tooltip title="View Details">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewCustomer(customer);
                                }}
                                size="small"
                                className="text-primary hover:bg-primary/5"
                              >
                                <Eye size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Customer">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewCustomer(customer);
                                }}
                                size="small"
                                className="text-primary hover:bg-primary/10"
                              >
                                <Edit size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Customer">
                              <IconButton
                                onClick={(e) => handleDeleteCustomer(customer._id, e)}
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

              {/* Pagination */}
              {!isSearchMode && totalPages > 1 && (
                <div className="bg-card  border-t border-border  p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground ">
                      Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalCustomers)} of {totalCustomers} customers
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* View Customer Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, customer: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-gray-950 text-white">
          <div className="flex items-center gap-3">
            <UserCog size={24} />
            <span>Customer Details</span>
          </div>
        </DialogTitle>
        <DialogContent className="mt-4">
          {viewDialog.customer && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground ">Customer ID</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.customerId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Name</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Email</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Mobile</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Alternate Phone</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.alternatePhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Address</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground ">Street</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.address?.street || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Locality</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.address?.locality || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">City</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.address?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">State</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.address?.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Country</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.address?.country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Postal Code</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.address?.postalCode || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-muted-foreground ">Landmark</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.address?.landmark || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Government ID */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Government ID</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground ">Type</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.governmentId?.type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Number</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.governmentId?.number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Issued Date</label>
                    <p className="font-medium text-foreground">{formatDate(viewDialog.customer.governmentId?.issuedDate) || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Expiry Date</label>
                    <p className="font-medium text-foreground">{formatDate(viewDialog.customer.governmentId?.expiryDate) || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Service Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground ">Plan Type</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.planType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Billing Type</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.billingType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Billing Cycle</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.billingCycle || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Validity Period</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.validityPeriod || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Service Status</label>
                    <p className="font-medium text-foreground">{viewDialog.customer.serviceStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Activation Date</label>
                    <p className="font-medium text-foreground">{formatDate(viewDialog.customer.activationDate) || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground ">Deactivation Date</label>
                    <p className="font-medium text-foreground">{formatDate(viewDialog.customer.deactivationDate) || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Creator Info */}
              {viewDialog.customer.createdBy && (
                <div className="bg-primary/5 p-3 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Created By</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{viewDialog.customer.createdBy.name}</span>
                    <span className="mx-2">•</span>
                    <span className="bg-primary/20 px-2 py-0.5 rounded text-xs">{viewDialog.customer.createdBy.role}</span>
                  </p>
                  <p className="text-xs text-muted-foreground  mt-1">
                    {viewDialog.customer.createdBy.email}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setViewDialog({ open: false, customer: null })}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => !saving && setEditDialog({ open: false, customer: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-primary text-white">
          <div className="flex items-center gap-3">
            <Edit size={24} />
            <span>Edit Customer</span>
          </div>
        </DialogTitle>
        <DialogContent className="mt-4">
          {editDialog.customer && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Customer ID
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.customerId || ''}
                      onChange={(e) => handleEditFieldChange('customerId', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.name || ''}
                      onChange={(e) => handleEditFieldChange('name', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={editDialog.customer.email || ''}
                      onChange={(e) => handleEditFieldChange('email', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={editDialog.customer.mobile || ''}
                      onChange={(e) => handleEditFieldChange('mobile', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Alternate Phone
                    </label>
                    <input
                      type="tel"
                      value={editDialog.customer.alternatePhone || ''}
                      onChange={(e) => handleEditFieldChange('alternatePhone', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.address?.street || ''}
                      onChange={(e) => handleEditFieldChange('address', e.target.value, 'street')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Locality
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.address?.locality || ''}
                      onChange={(e) => handleEditFieldChange('address', e.target.value, 'locality')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.address?.city || ''}
                      onChange={(e) => handleEditFieldChange('address', e.target.value, 'city')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.address?.state || ''}
                      onChange={(e) => handleEditFieldChange('address', e.target.value, 'state')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.address?.country || ''}
                      onChange={(e) => handleEditFieldChange('address', e.target.value, 'country')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.address?.postalCode || ''}
                      onChange={(e) => handleEditFieldChange('address', e.target.value, 'postalCode')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.address?.landmark || ''}
                      onChange={(e) => handleEditFieldChange('address', e.target.value, 'landmark')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Government ID */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Government ID</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.governmentId?.type || ''}
                      onChange={(e) => handleEditFieldChange('governmentId', e.target.value, 'type')}
                      placeholder="e.g., Aadhaar, PAN, Passport"
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.governmentId?.number || ''}
                      onChange={(e) => handleEditFieldChange('governmentId', e.target.value, 'number')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Issued Date
                    </label>
                    <input
                      type="date"
                      value={editDialog.customer.governmentId?.issuedDate || ''}
                      onChange={(e) => handleEditFieldChange('governmentId', e.target.value, 'issuedDate')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={editDialog.customer.governmentId?.expiryDate || ''}
                      onChange={(e) => handleEditFieldChange('governmentId', e.target.value, 'expiryDate')}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Service Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plan Type
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.planType || ''}
                      onChange={(e) => handleEditFieldChange('planType', e.target.value)}
                      placeholder="e.g., Premium, Basic"
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Billing Type
                    </label>
                    <select
                      value={editDialog.customer.billingType || ''}
                      onChange={(e) => handleEditFieldChange('billingType', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    >
                      <option value="">Select Type</option>
                      <option value="Prepaid">Prepaid</option>
                      <option value="Postpaid">Postpaid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={editDialog.customer.billingCycle || ''}
                      onChange={(e) => handleEditFieldChange('billingCycle', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    >
                      <option value="">Select Cycle</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Half-Yearly">Half-Yearly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Validity Period
                    </label>
                    <input
                      type="text"
                      value={editDialog.customer.validityPeriod || ''}
                      onChange={(e) => handleEditFieldChange('validityPeriod', e.target.value)}
                      placeholder="e.g., 30 Days, 1 Year"
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Service Status
                    </label>
                    <select
                      value={editDialog.customer.serviceStatus || 'Active'}
                      onChange={(e) => handleEditFieldChange('serviceStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Activation Date
                    </label>
                    <input
                      type="date"
                      value={editDialog.customer.activationDate || ''}
                      onChange={(e) => handleEditFieldChange('activationDate', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deactivation Date
                    </label>
                    <input
                      type="date"
                      value={editDialog.customer.deactivationDate || ''}
                      onChange={(e) => handleEditFieldChange('deactivationDate', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Creator Info (Read-only) */}
              {editDialog.customer.createdBy && (
                <div className="bg-muted/50  p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground ">
                    Created by: <span className="font-medium text-foreground">
                      {editDialog.customer.createdBy.name} ({editDialog.customer.createdBy.role})
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <button
            onClick={() => setEditDialog({ open: false, customer: null })}
            disabled={saving}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={saving || !editDialog.customer?.name || !editDialog.customer?.email || !editDialog.customer?.mobile}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Delete Customer Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card dark:bg-slate-950 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-border ">
            <h3 className="text-lg font-semibold text-foreground mb-4">Delete Customer</h3>
            <p className="text-muted-foreground dark:text-gray-300 mb-6">
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCustomer}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
