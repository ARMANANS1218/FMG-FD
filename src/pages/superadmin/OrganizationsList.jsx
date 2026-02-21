import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Trash2,
  Ban,
  CheckCircle2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import CreateOrganizationModal from '../../components/superadmin/CreateOrganizationModal';

const OrganizationsList = () => {
  const { getAuthHeaders } = useSuperAdmin();
  const { setHeaderAction } = useOutletContext() || {};
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Set header action
  useEffect(() => {
    if (setHeaderAction) {
      setHeaderAction(
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90 text-foreground-foreground px-4 py-2 rounded-full font-medium flex items-center shadow-md hover:shadow-lg transition-all text-sm group"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          New Organization
        </button>
      );
    }
  }, [setHeaderAction]);

  useEffect(() => {
    fetchOrganizations();
  }, [currentPage, filterPlan, filterStatus, searchTerm]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterPlan !== 'all' && { plan: filterPlan }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
      });

      const response = await axios.get(
        `${API_URL}/api/v1/superadmin/organizations?${params}`,
        getAuthHeaders()
      );

      if (response.data.status) {
        setOrganizations(response.data.data.organizations);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/v1/superadmin/organizations/${orgId}`,
        getAuthHeaders()
      );
      toast.success('Organization deleted successfully');
      fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  const handleSuspend = async (orgId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this organization?`)) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/${orgId}/${action}`,
        action === 'suspend' ? { reason: 'Admin action' } : {},
        getAuthHeaders()
      );
      toast.success(`Organization ${action}d successfully`);
      fetchOrganizations();
    } catch (error) {
      console.error(`Error ${action}ing organization:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} organization`);
    }
  };

  const filteredOrganizations = organizations;

  return (
    <div className="p-4 md:p-6 w-full mx-auto min-h-screen space-y-6">
      
      {/* Filters Toolbar */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-xl text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div className="flex w-full md:w-auto gap-3">
          {/* Plan Filter */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={filterPlan}
              onChange={(e) => {
                setFilterPlan(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-40 pl-3 pr-8 py-2.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-xl text-sm appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-40 pl-3 pr-8 py-2.5 bg-muted/40 hover:bg-muted/60 border border-border rounded-xl text-sm appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Organizations List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agents</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrganizations.map((org) => (
                    <tr key={org._id} className="group hover:bg-muted/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/10 flex items-center justify-center mr-4 border border-white/10">
                            <Building2 className="w-5 h-5 text-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{org.name}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{org.organizationId}</p>
                            {org.subdomain && (
                              <p className="text-[10px] text-foreground/80 mt-0.5">{org.subdomain}.chatcrm.com</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                          org.subscription?.plan === 'enterprise' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                          org.subscription?.plan === 'professional' ? 'bg-blue-100 bg-primary border-primary/20 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                          org.subscription?.plan === 'basic' ? 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800' :
                          'bg-muted text-gray-700 border-border  dark:text-gray-300 '
                        }`}>
                          {org.subscription?.plan || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {org.isSuspended ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">
                            <ShieldAlert className="w-3 h-3 mr-1" /> Suspended
                          </span>
                        ) : org.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-gray-700 border border-border  dark:text-gray-300 ">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground font-medium">
                        {org.subscription?.maxAgents ? `${org.subscription.maxAgents} seats` : 'Unlimited'}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/superadmin/organizations/${org._id}`}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-full transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleSuspend(org._id, !org.isSuspended)}
                            className={`p-2 rounded-full transition-colors ${
                              org.isSuspended 
                                ? 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                : 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                            }`}
                            title={org.isSuspended ? 'Activate' : 'Suspend'}
                          >
                            {org.isSuspended ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(org._id)}
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrganizations.length === 0 && (
              <div className="text-center py-20 px-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No organizations found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Adjust your search or filters to find what you're looking for, or create a new organization.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 border border-border bg-card text-foreground hover:bg-muted rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </button>
              <span className="text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center px-4 py-2 border border-border bg-card text-foreground hover:bg-muted rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOrganizations();
          }}
        />
      )}
    </div>
  );
};

export default OrganizationsList;
