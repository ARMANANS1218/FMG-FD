import React, { useState } from 'react';
import {
  useGetOrgLocationSummaryQuery,
  useGetOrgLocationRequestsByOrgQuery,
  useGetOrgAllowedLocationsByOrgQuery,
  useReviewOrgLocationRequestMutation,
  useStopAccessByOrgRequestMutation,
  useStartAccessByOrgRequestMutation,
  useDeleteOrgLocationRequestMutation,
  useRevokeOrgAllowedLocationMutation,
  useDeleteOrgAllowedLocationMutation,
} from '../../features/admin/adminApi';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Ban,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const OrgLocationSummary = () => {
  const { data, isLoading, error, refetch } = useGetOrgLocationSummaryQuery();

  const rows = data?.data || [];
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const OrgAccordion = ({ org, onRefreshSummary }) => {
    const isOpen = !!expanded[org.id];
    const { data: reqsData, refetch: refetchReqs } = useGetOrgLocationRequestsByOrgQuery(org.id, { skip: !isOpen });
    const { data: allowData, refetch: refetchAllow } = useGetOrgAllowedLocationsByOrgQuery(org.id, { skip: !isOpen });

    const [reviewReq] = useReviewOrgLocationRequestMutation();
    const [stopAccess] = useStopAccessByOrgRequestMutation();
    const [startAccess] = useStartAccessByOrgRequestMutation();
    const [deleteReq] = useDeleteOrgLocationRequestMutation();
    const [revokeAllowed] = useRevokeOrgAllowedLocationMutation();
    const [deleteAllowed] = useDeleteOrgAllowedLocationMutation();

    const requests = reqsData?.data?.items || [];
    const allowed = allowData?.data || [];

    const doAction = async (fn) => {
      await fn;
      await Promise.all([refetchReqs(), refetchAllow()]);
      if (typeof onRefreshSummary === 'function') onRefreshSummary();
    };

    if (!isOpen) return null;

    return (
      <div className="bg-muted/30 border-t border-border p-4 animate-in slide-in-from-top-2 duration-200">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center">
              <div className="bg-card p-2 rounded-lg mr-3">
                <MapPin className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Location Access Requests</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Manage geofencing requests for this organization</p>
              </div>
            </div>
            <button 
              onClick={() => { refetchReqs(); refetchAllow(); }} 
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-background border border-border hover:bg-muted text-foreground transition-colors flex items-center"
            >
              Refresh Data
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {requests.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">No location requests found for this organization.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/10 text-muted-foreground border-b border-border text-xs uppercase tracking-wide">
                    <th className="text-left py-3 px-6 font-medium">Address / Coordinates</th>
                    <th className="text-left py-3 px-6 font-medium">Radius</th>
                    <th className="text-left py-3 px-6 font-medium">Type</th>
                    <th className="text-left py-3 px-6 font-medium">Emergency</th>
                    <th className="text-left py-3 px-6 font-medium">Status</th>
                    <th className="text-right py-3 px-6 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map(r => (
                    <tr key={r._id} className="group hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium truncate max-w-xs" title={r.address}>{r.address || 'Unknown Location'}</span>
                          <span className="text-xs text-muted-foreground font-mono">{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-muted-foreground font-mono">{(r.requestedRadius ?? r.radius ?? 'NA')} m</td>
                      <td className="py-3 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize border border-border/50">
                          {r.requestType || 'permanent'}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        {r.emergency ? (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Emergency
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Normal</span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          r.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 
                          r.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 
                          r.status === 'stopped' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 
                          'bg-muted text-gray-700 border-border'
                        }`}>
                          {r.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {r.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {r.status === 'stopped' && <Ban className="w-3 h-3 mr-1" />}
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => doAction(reviewReq({ id: r._id, action: 'approve' }))} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors" title="Approve">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => doAction(reviewReq({ id: r._id, action: 'reject' }))} className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Reject">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {r.status === 'approved' && (
                            <button onClick={() => doAction(stopAccess(r._id))} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors" title="Suspend Access">
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {r.status === 'stopped' && (
                            <button onClick={() => doAction(startAccess(r._id))} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors" title="Reactivate Access">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => doAction(deleteReq(r._id))} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full mx-auto min-h-screen space-y-6">
      
      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No organizations found</h3>
          <p className="text-muted-foreground mt-1">There are no organizations configured with location settings yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-muted-foreground tracking-wider">Organization</th>
                  <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-muted-foreground tracking-wider">Enforcement</th>
                  <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-muted-foreground tracking-wider">Active Locations</th>
                  <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-muted-foreground tracking-wider">Requests Pending</th>
                  <th className="text-left py-4 px-6 font-semibold uppercase text-xs text-muted-foreground tracking-wider">Status Overview</th>
                  <th className="text-right py-4 px-6 font-semibold uppercase text-xs text-muted-foreground tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(r => {
                  const isExpanded = !!expanded[r.id];
                  return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${isExpanded ? 'bg-muted/30' : 'hover:bg-muted/20'}`}
                      onClick={() => toggleExpand(r.id)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isExpanded ? 'bg-primary text-foreground-foreground' : 'bg-muted text-muted-foreground'}`}>
                             <Building2 className="w-4 h-4" />
                           </div>
                           <span className="font-medium text-foreground">{r.name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          r.enforce 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                            : 'bg-muted text-muted-foreground border-border   '
                        }`}>
                          {r.enforce ? <ShieldCheck className="w-3 h-3 mr-1" /> : <ShieldCheck className="w-3 h-3 mr-1 opacity-50" />}
                          {r.enforce ? 'Enforced' : 'Optional'}
                        </span>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className="font-mono font-medium text-foreground">{r.activeAllowedCount}</span>
                        <span className="text-muted-foreground ml-1">locations</span>
                      </td>
                      
                      <td className="py-4 px-6">
                        {r.pendingCount > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 animate-pulse-slow">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {r.pendingCount} Pending
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">All processed</span>
                        )}
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 text-xs">
                          {r.approvedCount > 0 && (
                            <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                              {r.approvedCount} Active
                            </span>
                          )}
                          {r.stoppedCount > 0 && (
                            <span className="flex items-center text-red-600 dark:text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                              {r.stoppedCount} Suspended
                            </span>
                          )}
                          {!r.approvedCount && !r.stoppedCount && <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link 
                            to={`/superadmin/organizations/${r.id}`} 
                            onClick={(e)=>e.stopPropagation()} 
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Go to Organization Settings"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-foreground' : 'text-muted-foreground'}`}>
                             <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="p-0 border-none">
                        <OrgAccordion org={r} onRefreshSummary={refetch} />
                      </td>
                    </tr>
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgLocationSummary;
