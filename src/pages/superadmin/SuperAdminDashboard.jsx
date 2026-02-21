import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { getAuthHeaders } = useSuperAdmin();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlinkedAdminsCount, setUnlinkedAdminsCount] = useState(0);

  useEffect(() => {
    fetchDashboardStats();
    fetchUnlinkedAdmins();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/superadmin/dashboard/stats`,
        getAuthHeaders()
      );
      if (response.data.status) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnlinkedAdmins = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/superadmin/admins/unlinked`,
        getAuthHeaders()
      );
      if (response.data.status) {
        setUnlinkedAdminsCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unlinked admins:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const subscriptions = stats?.subscriptions || [];
  const usage = stats?.usage || {};
  const recentOrgs = stats?.recentOrganizations || [];

  return (
    <div className="p-4 md:p-6 space-y-6 w-full mx-auto min-h-screen">
      
      {/* Warning Banner for Unlinked Admins */}
      {unlinkedAdminsCount > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start shadow-sm animate-pulse-slow">
          <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg mr-4">
            <AlertTriangle className="text-orange-600 dark:text-orange-400 w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-orange-900 dark:text-orange-100 font-semibold mb-1">
              Action Required
            </h3>
            <p className="text-orange-700 dark:text-orange-300 text-sm mb-3">
              {unlinkedAdminsCount} Admin account{unlinkedAdminsCount !== 1 ? 's' : ''} are not linked to any organization.
            </p>
            <Link
              to="/superadmin/link-admins"
              className="inline-flex items-center text-sm font-medium text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 underline underline-offset-2"
            >
              Fix Now <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Organizations */}
        <div className="bg-card hover:bg-card/50 border border-border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100  p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Building2 className="w-6 h-6 text-foreground " />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Total Organizations</p>
          <h3 className="text-3xl font-bold text-foreground mt-1 tracking-tight">{overview.totalOrganizations || 0}</h3>
        </div>

        {/* Active Organizations */}
        <div className="bg-card hover:bg-card/50 border border-border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
              {overview.trialOrganizations || 0} Trial
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Active Tenants</p>
          <h3 className="text-3xl font-bold text-foreground mt-1 tracking-tight">{overview.activeOrganizations || 0}</h3>
        </div>

        {/* Suspended Organizations */}
        <div className="bg-card hover:bg-card/50 border border-border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Suspended</p>
          <h3 className="text-3xl font-bold text-foreground mt-1 tracking-tight">{overview.suspendedOrganizations || 0}</h3>
        </div>

        {/* Total Users */}
        <div className="bg-card hover:bg-card/50 border border-border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-violet-100 dark:bg-violet-900/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Total Users</p>
          <h3 className="text-3xl font-bold text-foreground mt-1 tracking-tight">{usage.totalUsers || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Breakdown */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-foreground" />
              Subscription Distribution
            </h2>
          </div>
          
          <div className="space-y-6">
            {subscriptions.length > 0 ? subscriptions.map((sub, index) => {
              const total = overview.totalOrganizations || 1;
              const percentage = Math.round(((sub.count / total) * 100));
              const colors = {
                trial: 'bg-amber-500',
                basic: 'bg-card0',
                professional: 'bg-violet-500',
                enterprise: 'bg-indigo-600',
                custom: 'bg-pink-500',
              };
              
              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground capitalize flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${colors[sub._id] || 'bg-muted/500'}`}></span>
                      {sub._id} Plan
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">{sub.count} ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${colors[sub._id] || 'bg-muted/500'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No subscription data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Organizations Feed */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-foreground" />
              Recent Signups
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/50">
            {recentOrgs.length > 0 ? (
              <div className="divide-y divide-border">
                {recentOrgs.map((org) => (
                  <div key={org._id} className="p-4 hover:bg-muted/40 transition-colors flex items-center justify-between group">
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-foreground transition-colors text-sm">
                        {org.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {org.organizationId}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        org.isActive && !org.isSuspended
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                          : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                      }`}>
                        {org.isActive && !org.isSuspended ? 'Active' : 'Suspended'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                         {new Date(org.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                <Building2 className="w-10 h-10 mb-3 opacity-20" />
                <p>No recent organizations found</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-muted/30 border-t border-border mt-auto">
            <Link 
              to="/superadmin/organizations" 
              className="flex items-center justify-center w-full py-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors bg-card hover:bg-primary/20 rounded-lg"
            >
              View All Organizations <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
