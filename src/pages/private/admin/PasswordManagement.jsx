import React, { useState, useMemo } from 'react';
import { CircularProgress, IconButton, Tooltip, TextField, Alert } from '@mui/material';
import { ContentCopy, Visibility, VisibilityOff, Search, Refresh } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const PasswordManagement = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showPasswords, setShowPasswords] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  const fetchPasswordsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/employees/passwords`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.status) {
        setEmployees(response.data.data || []);
        toast.success('Passwords data loaded successfully');
      } else {
        toast.error(response.data.message || 'Failed to load passwords');
      }
    } catch (error) {
      console.error('Error fetching passwords:', error);
      toast.error(error.response?.data?.message || 'Failed to load employee passwords');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
      const matchesSearch =
        searchQuery === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesRole && matchesSearch;
    });
  }, [employees, roleFilter, searchQuery]);

  const togglePasswordVisibility = (employeeId) => {
    setShowPasswords(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const copyPassword = (password, name) => {
    navigator.clipboard.writeText(password);
    toast.success(`Password for ${name} copied to clipboard!`);
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'Admin') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (role === 'Agent') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 ';
    if (role === 'TL') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  };

  return (
    <div className="p-6 min-h-screen bg-muted/50 ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🔐 Password Management
          </h1>
          <p className="text-muted-foreground ">
            View and manage employee passwords (Admin only)
          </p>
        </div>

        {/* Security Warning */}
        <Alert severity="warning" className="mb-6">
          <strong>Security Notice:</strong> This page displays sensitive password information. 
          Ensure you're in a secure environment and never share these passwords through insecure channels.
        </Alert>

        {/* Load Data Button */}
        {employees.length === 0 && (
          <div className="text-center py-12 bg-card  rounded-lg border border-border  mb-6">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Password Data Not Loaded
            </h3>
            <p className="text-muted-foreground  mb-4">
              Click the button below to load employee password information
            </p>
            <button
              onClick={fetchPasswordsData}
              disabled={loading}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <CircularProgress size={20} className="text-white" />
                  Loading...
                </>
              ) : (
                <>
                  <Visibility />
                  Load Password Data
                </>
              )}
            </button>
          </div>
        )}

        {employees.length > 0 && (
          <>
            {/* Filters */}
            <div className="p-4 mb-6 rounded-lg bg-card  border border-border  shadow-sm">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="flex-1 min-w-[250px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" fontSize="small" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border dark:border-slate-600 
                      bg-card  text-foreground
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-border dark:border-slate-600 
                    bg-card  text-foreground
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Agent">Agent</option>
                  <option value="QA">QA</option>
                  <option value="TL">TL</option>
                </select>

                {/* Refresh Button */}
                <Tooltip title="Refresh Data">
                  <IconButton
                    onClick={fetchPasswordsData}
                    disabled={loading}
                    className="bg-blue-100 dark:bg-blue-900/30 text-foreground "
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-card  rounded-lg border border-border ">
                <p className="text-sm text-muted-foreground  mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-foreground ">{employees.length}</p>
              </div>
              <div className="p-4 bg-card  rounded-lg border border-border ">
                <p className="text-sm text-muted-foreground  mb-1">Filtered Results</p>
                <p className="text-2xl font-bold text-green-600 ">{filteredEmployees.length}</p>
              </div>
              <div className="p-4 bg-card  rounded-lg border border-border ">
                <p className="text-sm text-muted-foreground  mb-1">Admins</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {employees.filter(e => e.role === 'Admin').length}
                </p>
              </div>
              <div className="p-4 bg-card  rounded-lg border border-border ">
                <p className="text-sm text-muted-foreground  mb-1">Agents</p>
                <p className="text-2xl font-bold text-indigo-600 ">
                  {employees.filter(e => e.role === 'Agent').length}
                </p>
              </div>
            </div>

            {/* Password List Table */}
            <div className="rounded-lg bg-card  border border-border  shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50  border-b border-border dark:border-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        SL No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        Employee ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        Password
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center">
                          <p className="text-muted-foreground ">No employees found matching your filters</p>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee, index) => (
                        <tr
                          key={employee._id}
                          className="hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-foreground">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {employee.name}
                              </p>
                              <p className="text-xs text-muted-foreground ">
                                {employee.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                              {employee.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {employee.employee_id || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-sm ${showPasswords[employee._id] ? 'text-foreground' : 'text-gray-400 dark:text-muted-foreground'}`}>
                                {showPasswords[employee._id] ? (employee.password || 'No password available') : '••••••••••'}
                              </span>
                            </div>
                            {(!employee.password || employee.password === 'No password available') && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                ⚠️ Password not available
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <Tooltip title={showPasswords[employee._id] ? 'Hide Password' : 'Show Password'}>
                                <IconButton
                                  size="small"
                                  onClick={() => togglePasswordVisibility(employee._id)}
                                  className="text-muted-foreground "
                                >
                                  {showPasswords[employee._id] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Copy Password">
                                <IconButton
                                  size="small"
                                  onClick={() => copyPassword(employee.password, employee.name)}
                                  className="text-foreground "
                                  disabled={!employee.password || employee.password === 'No password available'}
                                >
                                  <ContentCopy fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordManagement;
