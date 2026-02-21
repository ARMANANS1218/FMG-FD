import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Toasts use global container in App.jsx
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import ColorModeContext from '../../context/ColorModeContext';
import { toast } from 'react-toastify';
import CreateAdminModal from '../../components/superadmin/CreateAdminModal';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaSave, 
  FaBan, 
  FaCheckCircle,
  FaTrash,
  FaKey,
  FaUsers,
  FaChartLine,
  FaCopy,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaSync,
  FaChevronDown
} from 'react-icons/fa';
import { Shield, ShieldOff, Plus, X, Check as CheckIcon, Trash2, AlertCircle, ToggleRight, ToggleLeft } from 'lucide-react';

// Organization IP Configuration Component
const OrganizationIpConfigSection = ({ organizationId, getAuthHeaders }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ipAddresses, setIpAddresses] = useState([{ ip: '', description: '' }]);
  const [isActive, setIsActive] = useState(true);
  const [applyToRoles, setApplyToRoles] = useState(['Agent', 'TL', 'QA']);

  useEffect(() => {
    fetchConfig();
  }, [organizationId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/v1/organization-ip-config?organizationId=${organizationId}`, 
        getAuthHeaders()
      );
      setConfig(response.data.data);
    } catch (error) {
      console.error('Error fetching organization IP config:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load IP configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (config) {
      setIpAddresses(config.allowedIps.map(ip => ({
        ip: ip.ip,
        description: ip.description || ''
      })));
      setIsActive(config.isActive);
      setApplyToRoles(config.applyToRoles || ['Agent', 'TL', 'QA']);
    } else {
      setIpAddresses([{ ip: '', description: '' }]);
      setIsActive(true);
      setApplyToRoles(['Agent', 'TL', 'QA']);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIpAddresses([{ ip: '', description: '' }]);
    setIsActive(true);
    setApplyToRoles(['Agent', 'TL', 'QA']);
  };

  const handleAddIpField = () => {
    setIpAddresses([...ipAddresses, { ip: '', description: '' }]);
  };

  const handleRemoveIpField = (index) => {
    setIpAddresses(ipAddresses.filter((_, i) => i !== index));
  };

  const handleIpChange = (index, field, value) => {
    const updated = [...ipAddresses];
    updated[index][field] = value;
    setIpAddresses(updated);
  };

  const handleRoleToggle = (role) => {
    setApplyToRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSaveConfiguration = async () => {
    try {
      const validIps = ipAddresses
        .map(item => ({
          ip: item.ip.replace(/\/\d+$/, '').trim(),
          description: item.description.trim()
        }))
        .filter(item => item.ip);

      if (validIps.length === 0) {
        toast.error('Please add at least one IP address');
        return;
      }

      const uniqueIps = Array.from(new Map(validIps.map(item => [item.ip, item])).values());

      const payload = {
        organizationId,
        allowedIps: uniqueIps,
        isActive,
        applyToRoles
      };

      await axios.post(`${API_URL}/api/v1/organization-ip-config`, payload, 
        getAuthHeaders()
      );
      
      toast.success(`IP configuration ${config ? 'updated' : 'created'} successfully`);
      handleCloseModal();
      fetchConfig();
    } catch (error) {
      console.error('Error saving IP configuration:', error);
      toast.error(error.response?.data?.message || 'Failed to save IP configuration');
    }
  };

  const handleToggleStatus = async () => {
    try {
      await axios.patch(`${API_URL}/api/v1/organization-ip-config/toggle?organizationId=${organizationId}`, {}, 
        getAuthHeaders()
      );
      toast.success(`IP configuration ${!config.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchConfig();
    } catch (error) {
      console.error('Error toggling IP config status:', error);
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteConfiguration = async () => {
    if (!window.confirm('Are you sure you want to delete this IP configuration?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/v1/organization-ip-config?organizationId=${organizationId}`, 
        getAuthHeaders()
      );
      toast.success('IP configuration deleted successfully');
      setConfig(null);
    } catch (error) {
      console.error('Error deleting IP configuration:', error);
      toast.error('Failed to delete IP configuration');
    }
  };

  return (
    <div className="mt-6 rounded-xl shadow-sm p-6 border bg-card border-border">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Organization IP Configuration
        </h2>
        <p className="text-sm mt-1 text-muted-foreground">
          Configure IP restrictions for this organization's agents, team leaders, and QA
        </p>
      </div>

      <div className="rounded-lg p-4 mb-6 bg-card border border-primary/30">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-foreground" />
          <div className="text-sm text-foreground">
            <strong>SuperAdmin Control:</strong> Configure IP restrictions for this organization from here.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      ) : config ? (
        <div className="rounded-lg shadow-md p-6 bg-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className={`w-6 h-6 ${config.isActive ? 'text-success' : 'text-muted-foreground'}`} />
              <h2 className="text-xl font-semibold text-foreground">
                Current Configuration
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  config.isActive
                    ? 'bg-success/20 text-success hover:bg-success/30'
                    : 'bg-surface text-muted-foreground hover:bg-card-hover'
                }`}
              >
                {config.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {config.isActive ? 'Active' : 'Inactive'}
              </button>
              <button
                onClick={handleDeleteConfiguration}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-error/20 text-error hover:bg-error/30"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-muted-foreground">Allowed IP Addresses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {config.allowedIps.map((ipItem, index) => (
                <div key={index} className="rounded-lg p-3 border bg-surface border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckIcon className="w-4 h-4 text-success" />
                    <span className="font-mono font-semibold text-foreground">{ipItem.ip}</span>
                  </div>
                  {ipItem.description && (
                    <p className="text-sm ml-6 text-muted-foreground">{ipItem.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-muted-foreground">Applied to Roles</h3>
            <div className="flex gap-2">
              {config.applyToRoles.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-foreground"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-semibold">Created:</span>{' '}
                {new Date(config.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span>{' '}
                {new Date(config.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg shadow-md p-12 text-center bg-card">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No IP Configuration</h3>
          <p className="mb-6 text-muted-foreground">
            This organization doesn't have IP restrictions configured yet.
          </p>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="w-5 h-5" />
            Create IP Configuration
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-card">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  {config ? 'Edit' : 'Create'} Organization IP Configuration
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-muted-foreground">
                  Allowed IP Addresses
                </label>
                {ipAddresses.map((ipItem, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="e.g., 122.185.245.96"
                      value={ipItem.ip}
                      onChange={(e) => handleIpChange(index, 'ip', e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={ipItem.description}
                      onChange={(e) => handleIpChange(index, 'description', e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                    />
                    {ipAddresses.length > 1 && (
                      <button
                        onClick={() => handleRemoveIpField(index)}
                        className="px-3 py-2 rounded-lg transition-colors text-error hover:bg-error/20"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddIpField}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-foreground hover:bg-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Another IP
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-muted-foreground">
                  Apply Restrictions to Roles
                </label>
                <div className="flex gap-4">
                  {['Agent', 'TL', 'QA'].map((role) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyToRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                      />
                      <span className="text-muted-foreground">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-muted-foreground">
                    Configuration Status: {isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 border-border">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 rounded-lg transition-colors text-muted-foreground hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfiguration}
                className="px-6 py-2 text-white rounded-lg transition-colors bg-primary hover:bg-primary/90"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Lightweight local accordion component (updated with dropdown chevron and improved dark/light contrast)
const AccordionSection = ({ title, description, children, defaultOpen = false, compact = false, actions = null }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`w-full ${compact ? '' : 'mb-4'}`}>
      <div
        className={`w-full flex items-stretch rounded-md border overflow-hidden ${open ? 'border-violet-600' : 'border-border '} bg-muted `}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className={`flex-1 flex items-center justify-between px-4 py-3 text-left transition focus:outline-none ${open ? 'bg-violet-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} group`}
        >
          <div className="flex flex-col">
            <span className="font-semibold text-sm md:text-base flex items-center gap-2">
              {title}
            </span>
            {description && (
              <span className={`text-xs mt-0.5 hidden sm:block ${open ? 'opacity-90' : 'opacity-70'} ${open ? 'text-violet-100' : 'text-muted-foreground dark:text-gray-300'}`}>{description}</span>
            )}
          </div>
          <FaChevronDown
            className={`ml-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''} ${open ? 'text-white' : 'text-muted-foreground dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100'}`}
          />
        </button>
        {actions && (
          <div className={`flex items-center px-2 gap-2 ${open ? 'bg-violet-600' : 'bg-muted '}`}>
            {actions}
          </div>
        )}
      </div>
      {open && (
        <div className={`border border-t-0 rounded-b-md p-2 ${compact ? 'pt-3' : 'mt-0'} bg-card   animate-fade-in`}> 
          {children}
        </div>
      )}
    </div>
  );
};

const OrganizationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useSuperAdmin();
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState(null);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [adminToReset, setAdminToReset] = useState(null);
  const [customResetPassword, setCustomResetPassword] = useState('');
  const [useCustomResetPassword, setUseCustomResetPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({}); // Track which passwords are visible
  // Email Configs
  const [emailConfigs, setEmailConfigs] = useState([]);
  const [emailConfigsLoading, setEmailConfigsLoading] = useState(false);
  const [newEmailConfig, setNewEmailConfig] = useState({
    organization: id,
    emailAddress: '',
    imap: { host: 'mail.bitmaxtest.com', port: 993, secure: true, username: '', password: '' },
    smtp: { host: 'mail.bitmaxtest.com', port: 465, secure: true, username: '', password: '', fromName: '' },
    isEnabled: true,
  });
  const [creatingEmailConfig, setCreatingEmailConfig] = useState(false);
  const [editingEmailCfgId, setEditingEmailCfgId] = useState(null);
  const [editEmailCfg, setEditEmailCfg] = useState(null);

  // Location access state (SuperAdmin view)
  const [locRequests, setLocRequests] = useState([]);
  const [allowedLocations, setAllowedLocations] = useState([]);
  const [loadingLocationAccess, setLoadingLocationAccess] = useState(true);
  const [actingRequestId, setActingRequestId] = useState(null);
  const [actingAllowedId, setActingAllowedId] = useState(null);

  // Helper: status badge class
  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'bg-success/20 text-success';
    if (s === 'rejected') return 'bg-error/20 text-error';
    if (s === 'stopped') return 'bg-warning/20 text-warning';
    return 'bg-surface text-muted-foreground';
  };

  useEffect(() => {
    fetchOrganization();
    fetchAdmins();
    fetchLocationAccess();
    fetchEmailConfigs();
  }, [id]);

  const fetchOrganization = async () => {
    try {
      const authHeaders = getAuthHeaders();
      console.log('Fetching organization with ID:', id);
      console.log('Auth headers:', authHeaders);
      
      const response = await axios.get(
        `${API_URL}/api/v1/superadmin/organizations/${id}`,
        authHeaders
      );
      
      console.log('Organization response:', response.data);
      
      if (response.data.status) {
        // Backend returns { organization, stats } inside data
        const orgData = response.data.data.organization || response.data.data;
        console.log('Setting organization data:', orgData);
        setOrganization(orgData);
        setEditedData(orgData);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to fetch organization details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailConfigs = async () => {
    setEmailConfigsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/v1/email-ticketing/admin/configs`, getAuthHeaders());
      const orgConfigs = (res.data.configs || []).filter(c => c.organization === id);
      setEmailConfigs(orgConfigs);
    } catch (e) {
      console.error('Failed to load email configs', e);
    } finally {
      setEmailConfigsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/superadmin/organizations/${id}/admins`,
        getAuthHeaders()
      );
      if (response.data.status) {
        setAdmins(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      // Don't show error toast for 404 (no admins yet)
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch admins');
      }
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchLocationAccess = async () => {
    setLoadingLocationAccess(true);
    try {
      const [reqRes, allowedRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/location/org/requests`, {
          ...getAuthHeaders(),
          params: { organizationId: id }
        }),
        axios.get(`${API_URL}/api/v1/location/org/allowed`, {
          ...getAuthHeaders(),
          params: { organizationId: id }
        })
      ]);

      const reqItems = reqRes?.data?.data?.items ?? reqRes?.data?.data ?? [];
      setLocRequests(Array.isArray(reqItems) ? reqItems : []);
      setAllowedLocations(Array.isArray(allowedRes?.data?.data) ? allowedRes.data.data : []);
    } catch (error) {
      console.error('Error fetching location access data:', error);
      toast.error('Failed to fetch location access data');
    } finally {
      setLoadingLocationAccess(false);
    }
  };

  const reviewLocationRequest = async (requestId, action) => {
    if (!['approve','reject'].includes(action)) return;
    const reviewComments = action === 'reject' ? (prompt('Optional: Add review comments') || '') : '';
    setActingRequestId(requestId);
    try {
      await axios.put(
        `${API_URL}/api/v1/location/org/requests/${requestId}/review`,
        { action, reviewComments },
        getAuthHeaders()
      );
      toast.success(`Request ${action}ed`);
      fetchLocationAccess();
      fetchEmailConfigs();
    } catch (error) {
      console.error('Error reviewing request:', error);
      toast.error(error?.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActingRequestId(null);
    }
  };

  const stopAccessByRequest = async (requestId) => {
    if (!window.confirm('Stop access for this approved request?')) return;
    setActingRequestId(requestId);
    try {
      await axios.put(
        `${API_URL}/api/v1/location/org/requests/${requestId}/stop-access`,
        {},
        getAuthHeaders()
      );
      toast.success('Access stopped');
      fetchLocationAccess();
    } catch (error) {
      console.error('Error stopping access:', error);
      toast.error(error?.response?.data?.message || 'Failed to stop access');
    } finally {
      setActingRequestId(null);
    }
  };

  const startAccessByRequest = async (requestId) => {
    if (!window.confirm('Start access for this stopped request?')) return;
    setActingRequestId(requestId);
    try {
      await axios.put(
        `${API_URL}/api/v1/location/org/requests/${requestId}/start-access`,
        {},
        getAuthHeaders()
      );
      toast.success('Access started');
      fetchLocationAccess();
    } catch (error) {
      console.error('Error starting access:', error);
      toast.error(error?.response?.data?.message || 'Failed to start access');
    } finally {
      setActingRequestId(null);
    }
  };

  const revokeAllowedLocation = async (allowedId) => {
    if (!window.confirm('Revoke this allowed location? Users will not be able to login from there.')) return;
    setActingAllowedId(allowedId);
    try {
      await axios.put(
        `${API_URL}/api/v1/location/org/allowed/${allowedId}/revoke`,
        {},
        getAuthHeaders()
      );
      toast.success('Allowed location revoked');
      fetchLocationAccess();
    } catch (error) {
      console.error('Error revoking location:', error);
      toast.error(error?.response?.data?.message || 'Failed to revoke location');
    } finally {
      setActingAllowedId(null);
    }
  };

  const deleteAllowedLocation = async (allowedId) => {
    if (!window.confirm('Delete this allowed location permanently?')) return;
    setActingAllowedId(allowedId);
    try {
      await axios.delete(
        `${API_URL}/api/v1/location/org/allowed/${allowedId}`,
        getAuthHeaders()
      );
      toast.success('Allowed location deleted');
      fetchLocationAccess();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete location');
    } finally {
      setActingAllowedId(null);
    }
  };

  const deleteLocationRequest = async (requestId) => {
    if (!window.confirm('Delete this location request?')) return;
    setActingRequestId(requestId);
    try {
      await axios.delete(
        `${API_URL}/api/v1/location/org/requests/${requestId}`,
        getAuthHeaders()
      );
      toast.success('Location request deleted');
      fetchLocationAccess();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete request');
    } finally {
      setActingRequestId(null);
    }
  };

  const handleViewAdmin = async (admin) => {
    setSelectedAdmin(admin);
    setShowViewModal(true);
  };

  const handleEditAdmin = async (admin) => {
    setSelectedAdmin(admin);
    setEditFormData({
      name: admin.name,
      user_name: admin.user_name,
      email: admin.email,
      employee_id: admin.employee_id,
      mobile: admin.mobile,
      is_active: admin.is_active
    });
    setShowEditModal(true);
  };

  const handleUpdateAdmin = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/api/v1/superadmin/organizations/${id}/admins/${selectedAdmin._id}`,
        editFormData,
        getAuthHeaders()
      );
      if (response.data.status) {
        toast.success('Admin updated successfully');
        setShowEditModal(false);
        fetchAdmins();
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error(error.response?.data?.message || 'Failed to update admin');
    }
  };

  const handleResetPassword = (admin) => {
    setAdminToReset(admin);
    setShowResetPasswordForm(true);
    setCustomResetPassword('');
    setUseCustomResetPassword(false);
  };

  const handleConfirmResetPassword = async () => {
    if (!adminToReset) return;

    try {
      const payload = useCustomResetPassword && customResetPassword.trim() 
        ? { customPassword: customResetPassword.trim() }
        : {};

      const response = await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/${id}/admins/${adminToReset._id}/reset-password`,
        payload,
        getAuthHeaders()
      );
      
      if (response.data.status) {
        setResetPasswordData(response.data.data);
        setShowPasswordModal(true);
        setShowResetPasswordForm(false);
        toast.success('Password reset successfully');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to delete admin: ${adminName}?`)) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/v1/superadmin/organizations/${id}/admins/${adminId}`,
        getAuthHeaders()
      );
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const copyToClipboardText = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error(`Failed to copy ${label}`);
    });
  };

  const togglePasswordVisibility = (adminId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [adminId]: !prev[adminId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put(
        `${API_URL}/api/v1/superadmin/organizations/${id}`,
        editedData,
        getAuthHeaders()
      );
      if (response.data.status) {
        setOrganization(response.data.data);
        setEditedData(response.data.data);
        setEditing(false);
        toast.success('Organization updated successfully');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error(error.response?.data?.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!window.confirm(`Are you sure you want to ${organization.isSuspended ? 'activate' : 'suspend'} this organization?`)) {
      return;
    }

    try {
      const action = organization.isSuspended ? 'activate' : 'suspend';
      await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/${id}/${action}`,
        action === 'suspend' ? { reason: 'Admin action' } : {},
        getAuthHeaders()
      );
      toast.success(`Organization ${action}d successfully`);
      fetchOrganization();
    } catch (error) {
      console.error('Error updating organization status:', error);
      toast.error(error.response?.data?.message || 'Failed to update organization status');
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate the API key? The old key will stop working immediately.')) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/${id}/api-key/regenerate`,
        {},
        getAuthHeaders()
      );
      if (response.data.status) {
        const apiKey = response.data.data.apiKey;
        setNewApiKey(apiKey);
        setShowApiKey(true);
        toast.success('API Key regenerated successfully!');
        fetchOrganization();
      }
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast.error(error.response?.data?.message || 'Failed to regenerate API key');
    }
  };

  const createEmailConfig = async () => {
    setCreatingEmailConfig(true);
    try {
      await axios.post(`${API_URL}/api/v1/email-ticketing/admin/configs`, newEmailConfig, getAuthHeaders());
      toast.success('Email config created');
      setNewEmailConfig({
        organization: id,
        emailAddress: '',
        imap: { host: 'mail.bitmaxtest.com', port: 993, secure: true, username: '', password: '' },
        smtp: { host: 'mail.bitmaxtest.com', port: 465, secure: true, username: '', password: '', fromName: '' },
        isEnabled: true,
      });
      fetchEmailConfigs();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create email config');
    } finally {
      setCreatingEmailConfig(false);
    }
  };

  const toggleEmailConfigEnabled = async (cfg) => {
    try {
      await axios.put(`${API_URL}/api/v1/email-ticketing/admin/configs/${cfg._id}`, { isEnabled: !cfg.isEnabled }, getAuthHeaders());
      toast.success('Config updated');
      fetchEmailConfigs();
    } catch (e) {
      toast.error('Failed updating config');
    }
  };

  const deleteEmailConfig = async (cfg) => {
    if(!window.confirm('Delete this email config?')) return;
    try {
      await axios.delete(`${API_URL}/api/v1/email-ticketing/admin/configs/${cfg._id}`, getAuthHeaders());
      toast.success('Config deleted');
      fetchEmailConfigs();
    } catch (e) {
      toast.error('Failed deleting config');
    }
  };

  const testEmailConfig = async (cfg) => {
    try {
      const res = await axios.post(`${API_URL}/api/v1/email-ticketing/admin/configs/${cfg._id}/test`, {}, getAuthHeaders());
      const { result } = res.data;
      // IMAP toast
      if(result.imap.ok){
        toast.success('IMAP: Connected');
      } else {
        toast.error(`IMAP: ${result.imap.error || 'Failed'}`);
      }
      // SMTP toast
      if(result.smtp.skipped){
        toast.info('SMTP: Skipped (missing creds)');
      } else if(result.smtp.ok){
        toast.success('SMTP: Connected');
      } else {
        toast.error(`SMTP: ${result.smtp.error || 'Failed'}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Test failed');
    }
  };

  const startEditEmailConfig = (cfg) => {
    setEditingEmailCfgId(cfg._id);
    setEditEmailCfg({
      imap: { host: cfg.imap.host, port: cfg.imap.port, username: cfg.imap.username, password: '' },
      smtp: { host: cfg.smtp.host, port: cfg.smtp.port, username: cfg.smtp.username || '', password: '', fromName: cfg.smtp.fromName || '' },
      isEnabled: cfg.isEnabled,
    });
  };

  const cancelEditEmailConfig = () => { setEditingEmailCfgId(null); setEditEmailCfg(null); };

  const saveEditEmailConfig = async () => {
    if (!editingEmailCfgId || !editEmailCfg) return;
    try {
      const payload = {
        imap: { host: editEmailCfg.imap.host, port: Number(editEmailCfg.imap.port)||993, username: editEmailCfg.imap.username },
        smtp: { host: editEmailCfg.smtp.host, port: Number(editEmailCfg.smtp.port)||465, username: editEmailCfg.smtp.username || undefined, fromName: editEmailCfg.smtp.fromName },
        isEnabled: !!editEmailCfg.isEnabled,
      };
      if (editEmailCfg.imap.password) payload.imap.password = editEmailCfg.imap.password;
      if (editEmailCfg.smtp.password) payload.smtp.password = editEmailCfg.smtp.password;
      await axios.put(`${API_URL}/api/v1/email-ticketing/admin/configs/${editingEmailCfgId}`, payload, getAuthHeaders());
      toast.success('Config updated');
      cancelEditEmailConfig();
      fetchEmailConfigs();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update config');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedApiKey(true);
      toast.success('API Key copied to clipboard!');
      setTimeout(() => setCopiedApiKey(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy API Key');
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to DELETE this organization? This action cannot be undone!')) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
      toast.warning('Deletion cancelled');
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/v1/superadmin/organizations/${id}`,
        getAuthHeaders()
      );
      toast.success('Organization deleted successfully');
      navigate('/superadmin/organizations');
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  const toggleFeature = (featureName) => {
    setEditedData({
      ...editedData,
      features: {
        ...editedData.features,
        [featureName]: {
          ...editedData.features[featureName],
          enabled: !editedData.features[featureName].enabled,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Organization not found</p>
          <button
            onClick={() => navigate('/superadmin/organizations')}
            className="mt-4 text-foreground hover:text-foreground/80"
          >
            ← Back to Organizations
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/superadmin/organizations')}
            className="p-2 rounded-lg transition text-muted-foreground hover:bg-card"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{organization.name}</h1>
            <p className="text-muted-foreground">{organization.organizationId}</p>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditedData(organization);
                }}
                className="px-4 py-2 border rounded-lg transition border-border text-muted-foreground hover:bg-card"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center transition"
              >
                <FaSave className="mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg flex items-center transition"
              >
                <FaUserPlus className="mr-2" />
                Create Admin
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center transition"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
              <button
                onClick={handleSuspend}
                className={`px-4 py-2 rounded-lg flex items-center transition ${
                  organization.isSuspended
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {organization.isSuspended ? <FaCheckCircle className="mr-2" /> : <FaBan className="mr-2" />}
                {organization.isSuspended ? 'Activate' : 'Suspend'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {organization.isSuspended && (
        <div className="mb-6 border rounded-lg p-2 bg-error/20 border-error">
          <p className="text-error font-medium">⚠️ This organization is currently suspended</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="rounded-xl shadow-sm p-6 border bg-card border-border">
            <h2 className="text-xl font-bold mb-4 text-foreground">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Organization Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedData.name}
                    onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground placeholder-muted-foreground"
                  />
                ) : (
                  <p className="font-medium text-foreground">{organization.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Display Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedData.displayName || ''}
                    onChange={(e) => setEditedData({ ...editedData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground placeholder-muted-foreground"
                  />
                ) : (
                  <p className="font-medium text-foreground">{organization.displayName || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Domain</label>
                <p className="font-medium text-foreground">{organization.domain || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Subdomain</label>
                <p className="font-medium text-foreground">{organization.subdomain ? `${organization.subdomain}.chatcrm.com` : 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Admin Email</label>
                <p className="font-medium text-foreground">{organization.adminEmail}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Contact Phone</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedData.contactPhone || ''}
                    onChange={(e) => setEditedData({ ...editedData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground placeholder-muted-foreground"
                  />
                ) : (
                  <p className="font-medium text-foreground">{organization.contactPhone || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-xl shadow-sm p-6 border bg-card border-border">
            <h2 className="text-xl font-bold mb-4 text-foreground">Features & Permissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(editedData?.features || {}).map(([key, value]) => {
                // Handle both nested objects and simple boolean values
                const isEnabled = value?.enabled ?? value ?? false;
                return (
                  <div
                    key={key}
                    className={`p-2 border-2 rounded-lg transition ${
                      editing ? 'cursor-pointer' : ''
                    } ${
                      isEnabled
                        ? 'border-success bg-success/10'
                        : 'border-border bg-surface'
                    }`}
                    onClick={editing ? () => toggleFeature(key) : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-foreground">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className={`w-10 h-5 rounded-full transition ${
                        isEnabled ? 'bg-success' : 'bg-muted-foreground/30'
                      }`}>
                        <div className={`w-4 h-4 bg-card rounded-full shadow-md transform transition ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </div>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Login Location Access moved below Admins */}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Subscription */}
          <div className="rounded-xl shadow-sm p-3 border bg-card border-border">
            <h2 className="text-xl font-bold mb-4 text-foreground">Subscription</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Plan</label>
                {editing ? (
                  <select
                    value={editedData.subscription?.plan || 'basic'}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      subscription: { ...editedData.subscription, plan: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground"
                  >
                    <option value="trial">Trial</option>
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="custom">Custom</option>
                  </select>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium capitalize bg-primary/20 text-foreground">
                    {organization.subscription?.plan || 'N/A'}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  organization.subscription?.status === 'active'
                    ? 'bg-success/20 text-success'
                    : 'bg-surface text-muted-foreground'
                }`}>
                  {organization.subscription?.status || 'N/A'}
                </span>
              </div>

              {organization.subscription?.expiryDate && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Expires</label>
                  <p className="text-foreground">
                    {new Date(organization.subscription.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="rounded-xl shadow-sm p-5 border bg-card border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center text-foreground">
              <FaChartLine className="mr-2 text-foreground" />
              Usage Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Queries</span>
                <span className="font-semibold text-foreground">
                  {organization.usage?.queriesThisMonth || 0} / {organization.features?.query?.maxQueriesPerMonth || '∞'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Emails</span>
                <span className="font-semibold text-foreground">
                  {organization.usage?.emailsThisMonth || 0} / {organization.features?.email?.maxEmailsPerMonth || '∞'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Calls</span>
                <span className="font-semibold text-foreground">{organization.usage?.callsThisMonth || 0}</span>
              </div>
            </div>
          </div>

          {/* API Key */}
          <div className="rounded-xl shadow-sm p-6 border bg-card border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center text-foreground">
              <FaKey className="mr-2 text-warning" />
              API Key
            </h2>
            
            {/* Current API Key Display */}
            {organization.apiKeys && organization.apiKeys.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Current API Key:
                </label>
                <div className="bg-surface border-border border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <code className="font-mono text-sm flex-1 break-all overflow-wrap-anywhere text-foreground">
                      {showApiKey ? organization.apiKeys[0].key : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-2 rounded transition hover:bg-card-hover text-muted-foreground"
                        title={showApiKey ? "Hide API Key" : "Show API Key"}
                      >
                        {showApiKey ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(organization.apiKeys[0].key)}
                        className={`p-2 rounded transition ${
                          copiedApiKey 
                            ? 'bg-success text-white' 
                            : 'hover:bg-card-hover text-muted-foreground'
                        }`}
                        title="Copy API Key"
                      >
                        {copiedApiKey ? <FaCheck /> : <FaCopy />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* New API Key Display (After Regeneration) */}
            {newApiKey && (
              <div className="mb-4 p-2 rounded-lg bg-warning/20 border-warning border">
                <label className="block text-sm font-bold mb-2 text-warning">
                  🔑 New API Key (Save this!)
                </label>
                <div className="bg-card border-border border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <code className="font-mono text-sm flex-1 break-all overflow-wrap-anywhere text-foreground">
                      {newApiKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newApiKey)}
                      className={`p-2 rounded transition flex-shrink-0 ${
                        copiedApiKey 
                          ? 'bg-success text-white' 
                          : 'bg-surface hover:bg-card-hover text-foreground'
                      }`}
                      title="Copy New API Key"
                    >
                      {copiedApiKey ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>
                <p className="text-xs mt-2 text-warning">
                  ⚠️ This key will only be shown once. Copy it now!
                </p>
                <button
                  onClick={() => setNewApiKey(null)}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            <button
              onClick={handleRegenerateApiKey}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
            >
              Regenerate API Key
            </button>
            <p className="text-xs mt-2 text-muted-foreground">
              This will invalidate the current API key
            </p>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl shadow-sm p-6 border-2 bg-card border-error">
            <h2 className="text-xl font-bold mb-4 text-error">Danger Zone</h2>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center transition"
            >
              <FaTrash className="mr-2" />
              Delete Organization
            </button>
            <p className="text-xs mt-2 text-muted-foreground">
              This action cannot be undone
            </p>
          </div>
        </div>
      </div>

      {/* Email Configurations - Separate Section */}
      <div className="mt-6 rounded-xl shadow-sm p-6 border bg-card border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center text-foreground">Email Configurations</h2>
        {emailConfigsLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : emailConfigs.length === 0 ? (
          <p className="text-muted-foreground">No configs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="px-2 py-2 text-left">Email</th>
                  <th className="px-2 py-2 text-left">IMAP</th>
                  <th className="px-2 py-2 text-left">SMTP</th>
                  <th className="px-2 py-2 text-left">Enabled</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailConfigs.map(cfg => (
                  <tr key={cfg._id} className="border-t border-border">
                    <td className="px-2 py-2 text-foreground">{cfg.emailAddress}</td>
                    <td className="px-2 py-2 text-foreground">{cfg.imap.host}:{cfg.imap.port}</td>
                    <td className="px-2 py-2 text-foreground">{cfg.smtp.host}:{cfg.smtp.port}</td>
                    <td className="px-2 py-2">
                      <button onClick={() => toggleEmailConfigEnabled(cfg)} className={`px-2 py-1 rounded text-xs ${cfg.isEnabled ? 'bg-green-600 text-white' : 'bg-muted/500 text-white'}`}>{cfg.isEnabled ? 'Enabled' : 'Disabled'}</button>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${cfg.status==='connected' ? 'bg-green-600' : cfg.status==='error' ? 'bg-red-600' : 'bg-muted/500'}`}>{cfg.status}</span>
                    </td>
                    <td className="px-2 py-2 space-x-2">
                      <button onClick={() => testEmailConfig(cfg)} className="px-2 py-1 rounded bg-primary hover:bg-primary/90 text-white text-xs">Test</button>
                      <button onClick={() => startEditEmailConfig(cfg)} className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs">Edit</button>
                      <button onClick={() => deleteEmailConfig(cfg)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold mb-2 text-foreground">Create New Email Config</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input value={newEmailConfig.emailAddress} onChange={e=>setNewEmailConfig({...newEmailConfig, emailAddress:e.target.value})} placeholder="Email Address" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input value={newEmailConfig.imap.host} onChange={e=>setNewEmailConfig({...newEmailConfig, imap:{...newEmailConfig.imap, host:e.target.value}})} placeholder="IMAP Host" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input value={newEmailConfig.imap.port} onChange={e=>setNewEmailConfig({...newEmailConfig, imap:{...newEmailConfig.imap, port:Number(e.target.value)||''}})} placeholder="IMAP Port" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input value={newEmailConfig.imap.username} onChange={e=>setNewEmailConfig({...newEmailConfig, imap:{...newEmailConfig.imap, username:e.target.value}})} placeholder="IMAP Username" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input type="password" value={newEmailConfig.imap.password} onChange={e=>setNewEmailConfig({...newEmailConfig, imap:{...newEmailConfig.imap, password:e.target.value}})} placeholder="IMAP Password" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input value={newEmailConfig.smtp.host} onChange={e=>setNewEmailConfig({...newEmailConfig, smtp:{...newEmailConfig.smtp, host:e.target.value}})} placeholder="SMTP Host" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input value={newEmailConfig.smtp.port} onChange={e=>setNewEmailConfig({...newEmailConfig, smtp:{...newEmailConfig.smtp, port:Number(e.target.value)||''}})} placeholder="SMTP Port" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input value={newEmailConfig.smtp.username} onChange={e=>setNewEmailConfig({...newEmailConfig, smtp:{...newEmailConfig.smtp, username:e.target.value}})} placeholder="SMTP Username" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input type="password" value={newEmailConfig.smtp.password} onChange={e=>setNewEmailConfig({...newEmailConfig, smtp:{...newEmailConfig.smtp, password:e.target.value}})} placeholder="SMTP Password" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            <input value={newEmailConfig.smtp.fromName} onChange={e=>setNewEmailConfig({...newEmailConfig, smtp:{...newEmailConfig.smtp, fromName:e.target.value}})} placeholder="From Name" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newEmailConfig.isEnabled} onChange={e=>setNewEmailConfig({...newEmailConfig, isEnabled:e.target.checked})}/> <span className="text-muted-foreground">Enabled</span></label>
            <button disabled={creatingEmailConfig} onClick={createEmailConfig} className={`px-4 py-2 rounded ${creatingEmailConfig?'bg-gray-400':'bg-violet-600 hover:bg-violet-700'} text-white text-sm`}>{creatingEmailConfig?'Creating...':'Create Config'}</button>
          </div>
        </div>

        {editingEmailCfgId && editEmailCfg && (
          <div className="mt-4 rounded-xl shadow-sm p-6 border bg-card border-border">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Edit Email Config</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={editEmailCfg.imap.host} onChange={e=>setEditEmailCfg({...editEmailCfg, imap:{...editEmailCfg.imap, host:e.target.value}})} placeholder="IMAP Host" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
              <input value={editEmailCfg.imap.port} onChange={e=>setEditEmailCfg({...editEmailCfg, imap:{...editEmailCfg.imap, port:e.target.value}})} placeholder="IMAP Port" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
              <input value={editEmailCfg.imap.username} onChange={e=>setEditEmailCfg({...editEmailCfg, imap:{...editEmailCfg.imap, username:e.target.value}})} placeholder="IMAP Username" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
              <input type="password" value={editEmailCfg.imap.password} onChange={e=>setEditEmailCfg({...editEmailCfg, imap:{...editEmailCfg.imap, password:e.target.value}})} placeholder="IMAP Password (leave blank to keep)" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
              <input value={editEmailCfg.smtp.host} onChange={e=>setEditEmailCfg({...editEmailCfg, smtp:{...editEmailCfg.smtp, host:e.target.value}})} placeholder="SMTP Host" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
              <input value={editEmailCfg.smtp.port} onChange={e=>setEditEmailCfg({...editEmailCfg, smtp:{...editEmailCfg.smtp, port:e.target.value}})} placeholder="SMTP Port" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
              <input value={editEmailCfg.smtp.username} onChange={e=>setEditEmailCfg({...editEmailCfg, smtp:{...editEmailCfg.smtp, username:e.target.value}})} placeholder="SMTP Username" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
              <input type="password" value={editEmailCfg.smtp.password} onChange={e=>setEditEmailCfg({...editEmailCfg, smtp:{...editEmailCfg.smtp, password:e.target.value}})} placeholder="SMTP Password (leave blank to keep)" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
              <input value={editEmailCfg.smtp.fromName} onChange={e=>setEditEmailCfg({...editEmailCfg, smtp:{...editEmailCfg.smtp, fromName:e.target.value}})} placeholder="From Name" className="border rounded px-3 py-2 bg-surface border-border text-foreground"/>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editEmailCfg.isEnabled} onChange={e=>setEditEmailCfg({...editEmailCfg, isEnabled:e.target.checked})}/> <span className="text-muted-foreground">Enabled</span></label>
              <button onClick={saveEditEmailConfig} className="px-4 py-2 rounded bg-success hover:bg-success/90 text-white text-sm">Save</button>
              <button onClick={cancelEditEmailConfig} className="px-4 py-2 rounded text-sm bg-surface hover:bg-card-hover text-foreground">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Organization IP Configuration - Separate Section */}
      <OrganizationIpConfigSection organizationId={id} getAuthHeaders={getAuthHeaders} />

      {/* Admins Section - Full Width Below Email Configs */}
      <div className="mt-6 rounded-xl shadow-sm p-6 border bg-card border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center text-foreground">
          <FaUsers className="mr-2 text-foreground" />
          Organization Admins
        </h2>

        {loadingAdmins ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-foreground" />
            <p className="mt-2 text-muted-foreground">Loading admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8">
            <FaUsers className="mx-auto text-4xl mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No admins found for this organization</p>
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
            >
              Create First Admin
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Username</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Employee ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mobile</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Password</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr 
                    key={admin._id} 
                    className="border-b border-border hover:bg-card-hover transition"
                  >
                    <td className="py-3 px-4 text-foreground">
                      {admin.name}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {admin.user_name}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {admin.email}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {admin.employee_id || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {admin.mobile || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {/* View Password */}
                        {admin.visiblePassword ? (
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded font-mono text-sm bg-surface text-foreground">
                              {visiblePasswords[admin._id] ? admin.visiblePassword : '••••••••'}
                            </div>
                            <button
                              onClick={() => togglePasswordVisibility(admin._id)}
                              className="p-1.5 rounded transition text-muted-foreground hover:bg-surface"
                              title={visiblePasswords[admin._id] ? "Hide Password" : "View Password"}
                            >
                              {visiblePasswords[admin._id] ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                            </button>
                            <button
                              onClick={() => copyToClipboardText(admin.visiblePassword, 'Password')}
                              className="p-1.5 rounded transition text-muted-foreground hover:bg-surface"
                              title="Copy Password"
                            >
                              <FaCopy className="text-sm" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not available</span>
                        )}
                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleResetPassword(admin)}
                          className="px-2 py-1 text-xs rounded flex items-center gap-1 transition bg-warning hover:bg-warning/90 text-white"
                          title="Reset Password"
                        >
                          <FaSync className="text-xs" />
                          Reset
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        admin.is_active
                          ? 'bg-success/20 text-success'
                          : 'bg-error/20 text-error'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewAdmin(admin)}
                          className="p-2 rounded-lg transition text-foreground hover:bg-primary/20"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="p-2 rounded-lg transition text-foreground hover:bg-primary/20"
                          title="Edit Admin"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                          className="p-2 rounded-lg transition text-error hover:bg-error/20"
                          title="Delete Admin"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accordion: Login Location Access (now below Organization Admins) */}
      <div className="mt-6 rounded-xl shadow-sm border bg-card border-border text-foreground">
        <AccordionSection
          title="Login Location Access"
          defaultOpen={false}
          description="Configure and manage geo-fenced login access for this organization."
        >
          <div className="space-y-6">

            <div className="grid grid-cols-1 gap-6">
              {/* Unified Locations Section */}
              <div className="rounded-lg border border-border overflow-hidden">
                <AccordionSection
                  title="Locations (Requests & Allowed)"
                  defaultOpen={true}
                  compact
                  description="All location requests with their status. Approved requests act as active login zones."
                >
                  {loadingLocationAccess ? (
                    <p className="text-muted-foreground">Loading requests...</p>
                  ) : locRequests.length === 0 ? (
                    <div className="p-2 rounded-md bg-surface text-muted-foreground">
                      No requests yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border">
                            <th className="text-left py-2 px-2">Address</th>
                            <th className="text-left py-2 px-2">Radius</th>
                            <th className="text-left py-2 px-2">Type</th>
                            <th className="text-left py-2 px-2">Emergency</th>
                            <th className="text-left py-2 px-2">Status</th>
                            <th className="text-left py-2 px-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {locRequests.map((r) => (
                            <tr key={r._id} className="border-b border-border">
                              <td className="py-2 px-2 text-foreground">{r.address || '—'}</td>
                              <td className="py-2 px-2 text-foreground">{r.requestedRadius ?? r.radius} m</td>
                              <td className="py-2 px-2 capitalize text-foreground">{r.requestType || 'permanent'}</td>
                              <td className={`py-2 px-2 ${r.emergency ? 'text-error' : 'text-muted-foreground'}`}>{r.emergency ? 'Yes' : 'No'}</td>
                              <td className="py-2 px-2">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(r.status)}`}>{r.status}</span>
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex flex-wrap gap-2">
                                  {r.status === 'pending' && (
                                    <>
                                      <button
                                        disabled={actingRequestId === r._id}
                                        onClick={() => reviewLocationRequest(r._id, 'approve')}
                                        className="px-2 py-1 rounded text-white bg-success hover:bg-success/90"
                                      >Approve</button>
                                      <button
                                        disabled={actingRequestId === r._id}
                                        onClick={() => reviewLocationRequest(r._id, 'reject')}
                                        className="px-2 py-1 rounded text-white bg-error hover:bg-error/90"
                                      >Reject</button>
                                    </>
                                  )}
                                  {r.status === 'approved' && (
                                    <button
                                      disabled={actingRequestId === r._id}
                                      onClick={() => stopAccessByRequest(r._id)}
                                      className="px-2 py-1 rounded text-white bg-warning hover:bg-warning/90"
                                    >Suspend</button>
                                  )}
                                  {r.status === 'stopped' && (
                                    <button
                                      disabled={actingRequestId === r._id}
                                      onClick={() => startAccessByRequest(r._id)}
                                      className="px-2 py-1 rounded text-white bg-primary hover:bg-primary/90"
                                    >Reactivate</button>
                                  )}
                                  <button
                                    disabled={actingRequestId === r._id}
                                    onClick={() => deleteLocationRequest(r._id)}
                                    className="px-2 py-1 rounded bg-surface hover:bg-card-hover text-foreground"
                                  >Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </AccordionSection>
              </div>
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={showCreateAdminModal}
        onClose={() => setShowCreateAdminModal(false)}
        organizationId={id}
        organizationName={organization.name}
        onSuccess={() => {
          fetchOrganization();
          fetchAdmins();
        }}
      />

      {/* View Admin Modal */}
      {showViewModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-card">
            <div className="sticky top-0 p-6 border-b bg-card border-border z-10">
              <h2 className="text-2xl font-bold text-foreground">Admin Details</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Name</label>
                  <p className="font-medium text-foreground">{selectedAdmin.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Username</label>
                  <p className="font-medium text-foreground">{selectedAdmin.user_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Email</label>
                  <p className="font-medium text-foreground">{selectedAdmin.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Employee ID</label>
                  <p className="font-medium text-foreground">{selectedAdmin.employee_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Mobile</label>
                  <p className="font-medium text-foreground">{selectedAdmin.mobile || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAdmin.is_active
                      ? 'bg-success/20 text-success'
                      : 'bg-error/20 text-error'
                  }`}>
                    {selectedAdmin.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Created At</label>
                  <p className="font-medium text-foreground">
                    {selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 p-6 border-t bg-card border-border">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full px-4 py-2 rounded-lg transition bg-surface hover:bg-card-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-card">
            <div className="sticky top-0 p-6 border-b bg-card border-border z-10">
              <h2 className="text-2xl font-bold text-foreground">Edit Admin</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Username *</label>
                <input
                  type="text"
                  value={editFormData.user_name}
                  onChange={(e) => setEditFormData({ ...editFormData, user_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Email *</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Employee ID *</label>
                <input
                  type="text"
                  value={editFormData.employee_id}
                  onChange={(e) => setEditFormData({ ...editFormData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Mobile</label>
                <input
                  type="text"
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Status</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editFormData.is_active === true}
                      onChange={() => setEditFormData({ ...editFormData, is_active: true })}
                      className="w-4 h-4"
                    />
                    <span className="text-foreground">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editFormData.is_active === false}
                      onChange={() => setEditFormData({ ...editFormData, is_active: false })}
                      className="w-4 h-4"
                    />
                    <span className="text-foreground">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 p-6 border-t bg-card border-border flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 rounded-lg transition bg-surface hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAdmin}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Form Modal */}
      {showResetPasswordForm && adminToReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="rounded-xl shadow-2xl max-w-md w-full bg-card">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Reset Password</h2>
              <p className="text-sm mt-1 text-muted-foreground">
                For: {adminToReset.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Password Option Toggle */}
              <div className="p-2 rounded-lg border bg-surface border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomResetPassword}
                    onChange={(e) => {
                      setUseCustomResetPassword(e.target.checked);
                      if (!e.target.checked) {
                        setCustomResetPassword('');
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    Set custom password (otherwise auto-generated)
                  </span>
                </label>
              </div>

              {/* Custom Password Field */}
              {useCustomResetPassword && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-muted-foreground">
                    Custom Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={customResetPassword}
                      onChange={(e) => setCustomResetPassword(e.target.value)}
                      placeholder="Enter custom password"
                      className="w-full pl-4 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 transition bg-surface border-border text-foreground placeholder-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showResetPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="p-3 rounded-lg bg-card border border-primary/30">
                <p className="text-xs text-foreground">
                  {useCustomResetPassword 
                    ? '🔐 Your custom password will be set and shown once.' 
                    : '🔄 A random 8-character password will be generated.'}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setShowResetPasswordForm(false);
                  setAdminToReset(null);
                  setCustomResetPassword('');
                  setUseCustomResetPassword(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg transition bg-surface hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetPassword}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Success Modal */}
      {showPasswordModal && resetPasswordData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="rounded-xl shadow-2xl max-w-md w-full bg-card">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
                  <FaCheck className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Password Reset</h2>
                  <p className="text-sm text-muted-foreground">
                    For {resetPasswordData.admin.name}
                  </p>
                </div>
              </div>
              
              <div className="p-2 rounded-lg bg-warning/20 border border-warning">
                <p className="text-sm font-medium mb-2 text-warning">
                  ⚠️ Save these credentials - they won't be shown again!
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Email</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resetPasswordData.admin.email}
                    className="flex-1 px-3 py-2 border rounded-lg bg-surface border-border text-foreground"
                  />
                  <button
                    onClick={() => copyToClipboardText(resetPasswordData.admin.email, 'Email')}
                    className="px-3 py-2 rounded-lg transition bg-surface hover:bg-card-hover"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">
                  {resetPasswordData.isCustomPassword ? 'Custom Password' : 'New Generated Password'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resetPasswordData.tempPassword}
                    className="flex-1 px-3 py-2 border rounded-lg font-mono text-lg bg-surface border-border text-success"
                  />
                  <button
                    onClick={() => copyToClipboardText(resetPasswordData.tempPassword, 'Password')}
                    className="px-3 py-2 rounded-lg transition bg-surface hover:bg-card-hover"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setResetPasswordData(null);
                }}
                className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetails;

