import React, { useState } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaIdCard, FaPhone, FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';

const CreateAdminModal = ({ isOpen, onClose, organizationId, organizationName, onSuccess }) => {
  const { getAuthHeaders } = useSuperAdmin();

  const [formData, setFormData] = useState({
    name: '',
    user_name: '',
    email: '',
    employee_id: '',
    mobile: '',
    customPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.user_name || !formData.email || !formData.employee_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/superadmin/organizations/${organizationId}/admin/create`,
        formData,
        getAuthHeaders()
      );

      if (response.data.status) {
        setCreatedAdmin(response.data.data);
        toast.success('Admin created successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create admin';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      user_name: '',
      email: '',
      employee_id: '',
      mobile: '',
      customPassword: ''
    });
    setCreatedAdmin(null);
    setUseCustomPassword(false);
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl bg-card max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {createdAdmin ? '✅ Admin Created Successfully' : 'Create Organization Admin'}
            </h2>
            <p className="text-sm mt-1 text-muted-foreground">
              {organizationName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition hover:bg-card-hover text-muted-foreground"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!createdAdmin ? (
            // Create Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Full Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary transition bg-surface border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Username <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    placeholder="john_admin"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary transition bg-surface border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Email <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary transition bg-surface border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Employee ID <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    placeholder="EMP-2001"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary transition bg-surface border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* Mobile (Optional) */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary transition bg-surface border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* Password Option Toggle */}
              <div className="p-2 rounded-lg border bg-surface border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomPassword}
                    onChange={(e) => {
                      setUseCustomPassword(e.target.checked);
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, customPassword: '' }));
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
              {useCustomPassword && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-muted-foreground">
                    Custom Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="customPassword"
                      value={formData.customPassword}
                      onChange={handleChange}
                      placeholder="Enter custom password"
                      className="w-full pl-4 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary transition bg-surface border-border text-foreground placeholder-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="p-2 rounded-lg border bg-card border-primary/30">
                <p className="text-sm text-foreground">
                  ℹ️ {useCustomPassword ? 'Your custom password will be displayed after creation.' : 'A temporary password will be generated and displayed after creation.'} Make sure to save it securely.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border rounded-lg font-medium transition border-border text-muted-foreground hover:bg-card-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-foreground-foreground rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          ) : (
            // Success View with Credentials
            <div className="space-y-6">
              {/* Success Message */}
              <div className="p-2 rounded-lg border bg-success/20 border-success/30">
                <p className="font-medium text-success">
                  ✅ Admin account created successfully! Share these credentials securely.
                </p>
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                {/* Name */}
                <div className="p-2 rounded-lg border bg-surface border-border">
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Name
                  </label>
                  <p className="font-medium text-foreground">
                    {createdAdmin.user.name}
                  </p>
                </div>

                {/* Email */}
                <div className="p-2 rounded-lg border bg-surface border-border">
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Email (Login)
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {createdAdmin.user.email}
                    </p>
                    <button
                      onClick={() => copyToClipboard(createdAdmin.user.email, 'email')}
                      className={`p-2 rounded transition ${
                        copiedField === 'email' 
                          ? 'bg-success text-white' 
                          : 'hover:bg-card-hover text-muted-foreground'
                      }`}
                    >
                      {copiedField === 'email' ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>

                {/* Employee ID */}
                <div className="p-2 rounded-lg border bg-surface border-border">
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Employee ID
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {createdAdmin.user.employee_id}
                    </p>
                    <button
                      onClick={() => copyToClipboard(createdAdmin.user.employee_id, 'empId')}
                      className={`p-2 rounded transition ${
                        copiedField === 'empId' 
                          ? 'bg-success text-white' 
                          : 'hover:bg-card-hover text-muted-foreground'
                      }`}
                    >
                      {copiedField === 'empId' ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="p-2 rounded-lg border-2 bg-warning/10 border-warning">
                  <label className="block text-xs font-bold mb-1 text-warning">
                    🔑 {createdAdmin.isCustomPassword ? 'Custom Password' : 'Generated Password'} (Save This!)
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-lg font-bold text-warning">
                      {createdAdmin.tempPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdAdmin.tempPassword, 'password')}
                      className={`p-2 rounded transition ${
                        copiedField === 'password' 
                          ? 'bg-success text-white' 
                          : 'bg-warning/20 hover:bg-warning/30 text-warning'
                      }`}
                    >
                      {copiedField === 'password' ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>
                  <p className="text-xs mt-2 text-warning">
                    ⚠️ This password is shown only once. {createdAdmin.isCustomPassword ? 'Make sure to save it securely.' : 'The admin should change it after first login.'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-foreground-foreground rounded-lg font-medium transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateAdminModal;
