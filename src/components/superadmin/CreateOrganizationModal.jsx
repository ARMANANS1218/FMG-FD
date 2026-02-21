import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { FaTimes, FaSpinner, FaCheckCircle, FaCopy, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CreateOrganizationModal = ({ onClose, onSuccess }) => {
  const { getAuthHeaders } = useSuperAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    domain: '',
    subdomain: '',
    adminEmail: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'basic',
  });

  const [features, setFeatures] = useState({
    chat: { enabled: true, maxConcurrentChats: 50 },
    email: { enabled: false, maxEmailsPerMonth: 1000 },
    query: { enabled: true, maxQueriesPerMonth: 500 },
    videoCalls: { enabled: false, maxCallsPerMonth: 100 },
    audioCalls: { enabled: false, maxCallsPerMonth: 200 },
    analytics: { enabled: false, advancedReports: false },
    customBranding: { enabled: false, whiteLabel: false },
    apiAccess: { enabled: false, rateLimitPerMinute: 60 },
    integrations: { enabled: false, webhooks: false },
    aiChatbot: { enabled: false, monthlyMessages: 1000 },
    fileSharing: { enabled: false, maxFileSize: 5, totalStorage: 100 },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handlePlanChange = (plan) => {
    setFormData({ ...formData, plan });
    
    // Auto-configure features based on plan
    switch (plan) {
      case 'trial':
      case 'basic':
        setFeatures({
          ...features,
          chat: { enabled: true, maxConcurrentChats: 25 },
          query: { enabled: true, maxQueriesPerMonth: 250 },
          email: { enabled: false },
          videoCalls: { enabled: false },
          audioCalls: { enabled: false },
        });
        break;
      case 'professional':
        setFeatures({
          ...features,
          chat: { enabled: true, maxConcurrentChats: 100 },
          email: { enabled: true, maxEmailsPerMonth: 2000 },
          query: { enabled: true, maxQueriesPerMonth: 1000 },
          videoCalls: { enabled: true, maxCallsPerMonth: 200 },
          audioCalls: { enabled: true, maxCallsPerMonth: 300 },
          analytics: { enabled: true, advancedReports: false },
        });
        break;
      case 'enterprise':
        setFeatures({
          chat: { enabled: true, maxConcurrentChats: 500 },
          email: { enabled: true, maxEmailsPerMonth: 10000 },
          query: { enabled: true, maxQueriesPerMonth: 5000 },
          videoCalls: { enabled: true, maxCallsPerMonth: 1000 },
          audioCalls: { enabled: true, maxCallsPerMonth: 2000 },
          analytics: { enabled: true, advancedReports: true },
          customBranding: { enabled: true, whiteLabel: true },
          apiAccess: { enabled: true, rateLimitPerMinute: 120 },
          integrations: { enabled: true, webhooks: true },
          aiChatbot: { enabled: true, monthlyMessages: 10000 },
          fileSharing: { enabled: true, maxFileSize: 50, totalStorage: 1000 },
        });
        break;
      default:
        break;
    }
  };

  const toggleFeature = (featureName) => {
    setFeatures({
      ...features,
      [featureName]: {
        ...features[featureName],
        enabled: !features[featureName].enabled,
      },
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        features,
      };

      const response = await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/create`,
        payload,
        getAuthHeaders()
      );

      if (response.data.status) {
        setSuccess(response.data.data);
        toast.success('Organization created successfully!');
        
        // Don't auto-navigate - let user copy API key first
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create organization';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 z-50">
        <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
              <FaCheckCircle className="text-3xl text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Organization Created!</h2>
            
            <div className="bg-surface rounded-lg p-6 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-2">Organization ID:</p>
              <p className="font-mono font-bold text-foreground mb-4">{success.organization?.organizationId}</p>
              
              <p className="text-sm text-muted-foreground mb-2">API Key (Save this!):</p>
              <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm break-all text-foreground flex-1">{success.apiKey}</p>
                  <button
                    onClick={() => copyToClipboard(success.apiKey)}
                    className={`flex-shrink-0 p-2 rounded-lg transition ${
                      copiedApiKey 
                        ? 'bg-success text-white' 
                        : 'bg-surface text-muted-foreground hover:bg-card-hover'
                    }`}
                    title="Copy API Key"
                  >
                    {copiedApiKey ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-warning mt-2">
                ⚠️ This API key will only be shown once. Please copy and save it securely.
              </p>
              
              {success.setupUrl && (
                <>
                  <p className="text-sm text-muted-foreground mb-2 mt-4">Setup URL:</p>
                  <p className="text-foreground font-medium">{success.setupUrl}</p>
                </>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  navigate(`/superadmin/organizations/${success.organization._id}`);
                  onSuccess();
                }}
                className="bg-primary hover:bg-primary/90 text-foreground-foreground px-6 py-3 rounded-lg font-medium"
              >
                View Details
              </button>
              <button
                onClick={onSuccess}
                className="bg-surface hover:bg-card-hover text-muted-foreground px-6 py-3 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 z-50">
      <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-border border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Create New Organization</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-card-hover text-muted-foreground rounded-lg transition"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-2 border rounded-lg bg-error/20 border-error/30 text-error">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                  placeholder="XYZ Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                  placeholder="XYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                  placeholder="xyz.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Subdomain
                </label>
                <input
                  type="text"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                  placeholder="xyz"
                />
                <p className="text-xs text-muted-foreground mt-1">Will be: {formData.subdomain || 'xyz'}.chatcrm.com</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Admin Email *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                  placeholder="admin@xyz.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                  placeholder="support@xyz.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface border-border text-foreground placeholder-muted-foreground"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Subscription Plan</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['trial', 'basic', 'professional', 'enterprise', 'custom'].map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => handlePlanChange(plan)}
                  className={`p-2 border-2 rounded-lg font-medium capitalize transition ${
                    formData.plan === plan
                      ? 'border-primary bg-primary/20 text-foreground'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(features).map(([key, value]) => (
                <div
                  key={key}
                  className={`p-2 border-2 rounded-lg cursor-pointer transition ${
                    value.enabled
                      ? 'border-success bg-success/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleFeature(key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize text-foreground">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className={`w-12 h-6 rounded-full transition ${
                      value.enabled ? 'bg-success' : 'bg-muted'
                    }`}>
                      <div className={`w-5 h-5 bg-card rounded-full shadow-md transform transition ${
                        value.enabled ? 'translate-x-6' : 'translate-x-1'
                      } mt-0.5`} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {value.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border rounded-lg font-medium transition border-border text-muted-foreground hover:bg-card-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-foreground-foreground rounded-lg font-medium flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;
