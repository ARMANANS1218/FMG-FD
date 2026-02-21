import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  Zap,
  UserCheck,
  Mail,
  Phone,
  Trash2,
  Plane,
  XCircle,
  Calendar,
  CreditCard,
  Luggage,
  Utensils,
  FileText,
} from 'lucide-react';
import { useGetAllQueriesQuery, useAcceptQueryMutation } from '../../../features/query/queryApi';
import { useDeleteQueryMutation } from '../../../features/query/queryApi';
import ConfirmDialog from '../../../components/ConfirmDialog';
import useNotificationSound from '../../../hooks/useNotificationSound';
import { getQuerySocket } from '../../../socket/querySocket';
import { useGetProfileQuery } from '../../../features/auth/authApi';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow } from 'date-fns';

// Utility function to get proper display name from customer information
const getDisplayName = (customerName, customerEmail) => {
  // If no customerName, extract from email
  if (!customerName && customerEmail) {
    return customerEmail.split('@')[0];
  }

  // If customerName exists but looks like email prefix, try to make it more readable
  if (customerName) {
    // Check if it's just an email prefix (no spaces, all lowercase, might have numbers)
    if (!/\s/.test(customerName) && customerName === customerName.toLowerCase()) {
      // Try to convert email-like usernames to more readable format
      // e.g., "john.doe123" -> "John Doe"
      const cleaned = customerName.replace(/[0-9]/g, ''); // Remove numbers
      const parts = cleaned.split(/[._-]/); // Split by common separators

      if (parts.length > 1) {
        // Capitalize each part: ["john", "doe"] -> "John Doe"
        return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      } else if (cleaned.length > 2) {
        // Single word, just capitalize: "john" -> "John"
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }

    // If it already looks like a proper name (has spaces, mixed case), return as is
    return customerName;
  }

  return 'Guest User';
};

export default function QueryManagement() {
  const navigate = useNavigate();
  const { play } = useNotificationSound();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: profileData } = useGetProfileQuery();
  // Don't filter on backend - get all queries and filter on frontend
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    data: queriesData,
    isLoading,
    refetch,
  } = useGetAllQueriesQuery({
    category: filterCategory === 'all' ? undefined : filterCategory,
    page,
    limit: pageSize,
    sort: 'createdAt:desc',
  });

  const [acceptQuery, { isLoading: isAccepting }] = useAcceptQueryMutation();
  const [deleteQuery, { isLoading: isDeleting }] = useDeleteQueryMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPetitionId, setPendingPetitionId] = useState(null);
  const [confirmMode, setConfirmMode] = useState(null); // 'transfer' | 'delete' | null
  const [transferInfo, setTransferInfo] = useState(null); // holds payload from socket
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentUser = profileData?.data;
  // Handle the API response structure - backend returns { data: { all: [], pending: [], ... } }
  const allQueries = Array.isArray(queriesData?.data?.all) ? queriesData.data.all : [];
  const pagination = queriesData?.pagination || null;

  // Debug logging
  console.log('QueryManagement Debug:', {
    queriesData,
    allQueries,
    allQueriesLength: allQueries.length,
    currentUser: currentUser?._id,
    isLoading,
  });

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Listen for real-time query events (new pending queries, transfers, etc.)
  useEffect(() => {
    const socket = getQuerySocket();
    const onNewPending = (data) => {
      const ts = data?.timestamp ? new Date(data.timestamp) : new Date();
      const timeStr = isNaN(ts) ? '' : ` • ${format(ts, 'MMM dd, hh:mm a')}`;
      toast.info(`New Query: ${data.petitionId} • ${data.subject}${timeStr}`);
      play();
      refetch();
    };

    const onFeedbackReceived = (data) => {
      toast.success(`Feedback received for ${data.petitionId}: ⭐ ${data.rating}/5`);
      refetch(); // Refresh query list to show feedback
    };

    socket.on('new-pending-query', onNewPending);
    socket.on('feedback-received', onFeedbackReceived);

    return () => {
      socket.off('new-pending-query', onNewPending);
      socket.off('feedback-received', onFeedbackReceived);
    };
  }, [play, refetch, currentUser?._id]);

  // Filter queries - with safety checks
  const filteredQueries = Array.isArray(allQueries)
    ? allQueries.filter((query) => {
        // Filter by active tab
        let matchesTab = true;
        if (activeTab === 'Pending') {
          // Changed: Ensure Pending tab ONLY shows queries with status 'Pending'
          matchesTab = query.status === 'Pending';
        } else if (activeTab === 'InProgress') {
          matchesTab = query.status === 'In Progress';
        } else if (activeTab === 'my') {
          // Show queries resolved by OR assigned to (Accepted/InProgress) the current agent
          const resolvedById =
            typeof query.resolvedBy === 'object' ? query.resolvedBy?._id : query.resolvedBy;
          const assignedToId =
            typeof query.assignedTo === 'object' ? query.assignedTo?._id : query.assignedTo;

          const isResolvedByMe = query.status === 'Resolved' && resolvedById === currentUser?._id;
          const isAssignedToMe =
            (query.status === 'Accepted' || query.status === 'In Progress') &&
            assignedToId === currentUser?._id;

          matchesTab = isResolvedByMe || isAssignedToMe;

          // Debug logging
          if (matchesTab) {
            console.log('My Queries Filter Match:', {
              petitionId: query.petitionId,
              status: query.status,
              isResolvedByMe,
              isAssignedToMe,
            });
          }
        } else if (activeTab === 'Resolved') {
          matchesTab = query.status === 'Resolved';
        } else if (activeTab === 'Escalated') {
          // Show BOTH:
          // 1) Queries escalated BY current user (outgoing)
          // 2) Queries escalated TO current user (incoming)
          if (query.transferHistory && query.transferHistory.length > 0) {
            const latestTransfer = query.transferHistory[query.transferHistory.length - 1];
            const fromAgentId =
              typeof latestTransfer?.fromAgent === 'object'
                ? latestTransfer?.fromAgent?._id
                : latestTransfer?.fromAgent;
            const toAgentId =
              typeof latestTransfer?.toAgent === 'object'
                ? latestTransfer?.toAgent?._id
                : latestTransfer?.toAgent;
            
            // Match if current user is either the sender OR receiver of escalation
            const escalatedByMe = fromAgentId === currentUser?._id;
            const escalatedToMe = toAgentId === currentUser?._id;
            matchesTab = escalatedByMe || escalatedToMe;
          } else {
            matchesTab = false;
          }
        }
        // activeTab === 'all' shows everything

        const matchesSearch =
          query.petitionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          query.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          query.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getDisplayName(query.customerName, query.customerEmail)
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesPriority = filterPriority === 'all' || query.priority === filterPriority;

        return matchesTab && matchesSearch && matchesPriority;
      })
    : [];

  // Stats calculation - prefer backend counts when available
  const backendCounts = queriesData?.data?.counts;
  const stats = {
    pending:
      typeof backendCounts?.pending === 'number'
        ? backendCounts.pending
        : Array.isArray(allQueries)
        ? allQueries.filter((q) => q.status === 'Pending').length
        : 0,
    inProgress:
      typeof backendCounts?.inProgress === 'number'
        ? backendCounts.inProgress
        : Array.isArray(allQueries)
        ? allQueries.filter((q) => q.status === 'In Progress').length
        : 0,
    myQueries: Array.isArray(allQueries)
      ? allQueries.filter((q) => {
          const resolvedById = typeof q.resolvedBy === 'object' ? q.resolvedBy?._id : q.resolvedBy;
          const assignedToId = typeof q.assignedTo === 'object' ? q.assignedTo?._id : q.assignedTo;

          const isResolvedByMe = q.status === 'Resolved' && resolvedById === currentUser?._id;
          const isAssignedToMe =
            (q.status === 'Accepted' || q.status === 'In Progress') &&
            assignedToId === currentUser?._id;

          return isResolvedByMe || isAssignedToMe;
        }).length
      : 0,
    resolved:
      typeof backendCounts?.resolved === 'number'
        ? backendCounts.resolved
        : Array.isArray(allQueries)
        ? allQueries.filter((q) => q.status === 'Resolved').length
        : 0,
    escalated:
      typeof backendCounts?.escalated === 'number'
        ? backendCounts.escalated
        : Array.isArray(allQueries)
        ? allQueries.filter((q) => {
            if (q.transferHistory && q.transferHistory.length > 0) {
              const latestTransfer = q.transferHistory[q.transferHistory.length - 1];
              const fromAgentId =
                typeof latestTransfer?.fromAgent === 'object'
                  ? latestTransfer?.fromAgent?._id
                  : latestTransfer?.fromAgent;
              const toAgentId =
                typeof latestTransfer?.toAgent === 'object'
                  ? latestTransfer?.toAgent?._id
                  : latestTransfer?.toAgent;
              
              // Count if current user is either the sender OR receiver
              return fromAgentId === currentUser?._id || toAgentId === currentUser?._id;
            }
            return false;
          }).length
        : 0,
    total:
      typeof backendCounts?.total === 'number'
        ? backendCounts.total
        : Array.isArray(allQueries)
        ? allQueries.length
        : 0,
  };

  // Debug logging for stats
  console.log('QueryManagement Stats:', {
    stats,
    currentUserId: currentUser?._id,
    totalQueries: allQueries.length,
    acceptedInProgress: allQueries.filter(
      (q) => q.status === 'Accepted' || q.status === 'In Progress'
    ).length,
  });

  const handleAcceptQuery = async (petitionId, e) => {
    e.stopPropagation();

    try {
      await acceptQuery(petitionId).unwrap();
      toast.success('Query accepted successfully!');
      play();
      refetch();

      // Navigate to chat based on user role
      const userRole = currentUser?.role?.toLowerCase();
      const rolePath = userRole;
      setTimeout(() => {
        navigate(`/${rolePath}/query/${petitionId}`);
      }, 500);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to accept query');
    }
  };

  const handleDeleteQuery = async (petitionId, e) => {
    e?.stopPropagation?.();
    setPendingPetitionId(petitionId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingPetitionId) return;
    try {
      await deleteQuery(pendingPetitionId).unwrap();
      toast.success('Query deleted');
      play();
      setConfirmOpen(false);
      setPendingPetitionId(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete query');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      Accepted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'In Progress': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      Resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
      Expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      Transferred: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      Escalated: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      InProgress: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };
    return colors[status] || colors['Pending'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      Medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      High: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      Urgent: 'text-red-500 bg-red-500/10 border-red-500/20',
    };
    return colors[priority] || colors['Medium'];
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Booking: Plane,
      Cancellation: XCircle,
      Reschedule: Calendar,
      Refund: CreditCard,
      Baggage: Luggage,
      'Check-in': CheckCircle,
      'Meal / Seat': Utensils,
      'Visa / Travel Advisory': FileText,
      Other: AlertCircle
    };
    return icons[category] || AlertCircle;
  };

  const tabs = [
    { id: 'all', label: 'All Queries', count: stats.total },
    { id: 'Pending', label: 'Pending', count: stats.pending },
    { id: 'InProgress', label: 'In Progress', count: stats.inProgress },
    { id: 'my', label: 'My Queries', count: stats.myQueries },
    { id: 'Resolved', label: 'Resolved', count: stats.resolved },
    { id: 'Escalated', label: 'Escalated', count: stats.escalated },
  ];

  const categories = [
    'all', 
    'Booking', 'Cancellation', 'Reschedule', 'Refund', 
    'Baggage', 'Check-in', 'Meal / Seat', 'Visa / Travel Advisory', 
    'Other'
  ];
  const priorities = ['all', 'Low', 'Medium', 'High', 'Urgent'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/50 ">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground ">Loading queries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Horizontal line below navbar - spans full width */}
      <div className="w-full border-b border-border"></div>

      {/* Main Layout: Left Content + Right Sidebar */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Column - Main Content */}
        <div className="flex-1 lg:flex-[3]">
          {/* Header */}
          <div className="bg-card sticky top-0 z-10 border-b border-border">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by Petition ID, Subject, or Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary bg-background text-foreground text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setIsRefreshing(true);
                      await refetch();
                      setTimeout(() => setIsRefreshing(false), 500);
                    }}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 px-3 py-2 border border-border bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>

                  <button className="relative p-2 hover:bg-muted rounded-lg transition-colors border border-border">
                    <Bell size={18} className="text-muted-foreground" />
                    {stats.pending > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-card">
                        {stats.pending > 9 ? '9+' : stats.pending}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm flex items-center gap-2 border ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground hover:bg-muted border-border hover:border-muted-foreground/20'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Query List */}
          <div className="px-4 sm:px-6 py-6 space-y-4">
            {filteredQueries.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No queries found
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search or filters to find what you are looking for.'
                    : 'Great job! All queries have been handled.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {filteredQueries.map((query) => {
                    const CategoryIcon = getCategoryIcon(query.category);
                    const isMyQuery = query.assignedTo === currentUser?._id;
                    const canAccept = query.status === 'Pending';
                    const hasPendingTransfer =
                      query.status === 'Transferred' &&
                      query.transferHistory?.some((transfer) => {
                        const toId =
                          typeof transfer.toAgent === 'object'
                            ? transfer.toAgent?._id
                            : transfer.toAgent;
                        const me = currentUser?._id;
                        return (
                          transfer.status === 'Requested' && toId?.toString() === me?.toString()
                        );
                      });
                    const userRole = currentUser?.role?.toLowerCase();
                    const displayStatus =
                      query.status === 'Transferred' ? 'Escalated' : query.status;

                    const rolePath = userRole;
                    return (
                      <div
                        key={query._id}
                        onClick={() => navigate(`/${rolePath}/query/${query.petitionId}`)}
                        className="group relative bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="p-4">
                          {/* Header Row */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {query.customer?.profileImage ? (
                                <img
                                  src={query.customer?.profileImage}
                                  alt={query.customer.name}
                                  className="w-10 h-10 rounded-full object-cover border border-border"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                                  {getDisplayName(query.customerName, query.customerEmail)[0]}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground text-sm">
                                    {getDisplayName(query.customerName, query.customerEmail)}
                                  </h3>
                                  {isMyQuery && (
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full border border-primary/20">
                                      Assigned to me
                                    </span>
                                  )}
                                  {isMyQuery &&
                                    query.transferHistory?.length > 0 &&
                                    (() => {
                                      const last =
                                        query.transferHistory[query.transferHistory.length - 1];
                                      if (!last) return null;
                                      return (
                                        <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] font-medium rounded-full border border-orange-500/20">
                                          Escalated by {last.fromAgentName || 'other'}
                                        </span>
                                      );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-mono font-medium opacity-80">
                                    {query.petitionId}
                                  </span>
                                  <span className="opacity-50">•</span>
                                  <span className="flex items-center gap-1">
                                     {formatDistanceToNow(new Date(query.createdAt || query.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Delete button */}
                              {currentUser?.role === 'Admin' && (
                                <button
                                  onClick={(e) => {
                                    setConfirmMode('delete');
                                    handleDeleteQuery(query.petitionId, e);
                                  }}
                                  disabled={isDeleting}
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                  title="Delete query"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}

                              {/* Evaluation Badge */}
                              {query?.evaluation && (
                                <span
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                    query.evaluation.totalWeightedScore >= 80
                                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                      : query.evaluation.totalWeightedScore >= 60
                                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                      : query.evaluation.totalWeightedScore >= 40
                                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                                  }`}
                                >
                                  <span>{query.evaluation.performanceCategory}</span>
                                  <span className="font-bold">
                                    {query.evaluation.totalWeightedScore}%
                                  </span>
                                </span>
                              )}

                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  query.status
                                )}`}
                              >
                                {displayStatus}
                              </span>

                              {/* Feedback Badge */}
                              {query.feedback && (
                                <span
                                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1"
                                >
                                  <span className="text-amber-500">⭐</span> {query.feedback.rating}/5
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Info Badges Row */}
                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                            <span
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getPriorityColor(
                                query.priority
                              )}`}
                            >
                              <AlertCircle size={12} />
                              {query.priority}
                            </span>

                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 text-muted-foreground rounded-md text-xs font-medium border border-border">
                              <CategoryIcon size={12} />
                              {query.category}
                            </span>

                            {query.messages?.length > 0 && (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/5 text-purple-500 rounded-md text-xs font-medium border border-purple-500/10">
                                <Mail size={12} />
                                {query.messages.length}{' '}
                                {query.messages.length === 1 ? 'msg' : 'msgs'}
                              </span>
                            )}

                             {/* Action Buttons inside Card */}
                            <div className="ml-auto flex items-center gap-2">
                               {canAccept && (
                                <button
                                  onClick={(e) => handleAcceptQuery(query.petitionId, e)}
                                  disabled={isAccepting}
                                  className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-medium transition-colors"
                                >
                                  Accept
                                </button>
                              )}
                              
                               {hasPendingTransfer && (
                                <button
                                  onClick={(e) => handleAcceptQuery(query.petitionId, e)}
                                  disabled={isAccepting}
                                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-xs font-medium transition-colors"
                                >
                                  Accept Transfer
                                </button>
                              )}
                              
                               <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                                  View <ArrowRight size={12} />
                               </span>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-between py-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setPageSize(val);
                          setPage(1);
                        }}
                        className="bg-background px-2 py-1 border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {[10, 20, 30, 50, 100].map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                    </div>
                    {pagination && (
                      <span>
                        Page {pagination.page} of {pagination.pages} • Total {pagination.total}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!pagination || pagination.page <= 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      className="px-3 py-1 bg-background border border-border rounded text-xs font-medium hover:bg-muted disabled:opacity-50 disabled:hover:bg-background transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={!pagination || pagination.page >= pagination.pages}
                      onClick={() =>
                        setPage((prev) =>
                          pagination ? Math.min(prev + 1, pagination.pages) : prev + 1
                        )
                      }
                      className="px-3 py-1 bg-background border border-border rounded text-xs font-medium hover:bg-muted disabled:opacity-50 disabled:hover:bg-background transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Stats Sidebar (Desktop Only) */}
        <div className="hidden lg:block lg:w-[220px] lg:flex-shrink-0 border-l border-border bg-background/50">
          <div className="sticky top-0 p-4 space-y-3">
            {/* Stats in Vertical Column */}
            <div className="space-y-4">
              {/* All Queries */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('all')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('all')}
                className="bg-card rounded-lg px-4 py-6 border border-border hover:border-slate-500/50 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-slate-500 transition-colors">
                    All Queries
                  </p>
                  <div className="w-10 h-10 bg-slate-500/10 rounded-full flex items-center justify-center border border-slate-500/20">
                    <CheckCircle size={20} className="text-slate-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground group-hover:text-slate-500 transition-colors">
                  {stats.total}
                </p>
              </div>

              {/* Pending */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('Pending')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('Pending')}
                className="bg-card rounded-lg px-4 py-6 border border-border hover:border-yellow-500/50 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-yellow-500 transition-colors">
                    Pending
                  </p>
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
                    <Clock size={20} className="text-yellow-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground group-hover:text-yellow-500 transition-colors">
                  {stats.pending}
                </p>
              </div>

              {/* In Progress */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('InProgress')}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') && setActiveTab('InProgress')
                }
                className="bg-card rounded-lg px-4 py-6 border border-border hover:border-purple-500/50 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-purple-500 transition-colors">
                    In Progress
                  </p>
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                    <RefreshCw size={20} className="text-purple-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground group-hover:text-purple-500 transition-colors">
                  {stats.inProgress}
                </p>
              </div>

              {/* My Queries */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('my')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('my')}
                className="bg-card rounded-lg px-4 py-6 border border-border hover:border-blue-500/50 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-blue-500 transition-colors">My Queries</p>
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                    <User size={20} className="text-blue-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground group-hover:text-blue-500 transition-colors">
                  {stats.myQueries}
                </p>
              </div>

              {/* Resolved */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('Resolved')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('Resolved')}
                className="bg-card rounded-lg px-4 py-6 border border-border hover:border-green-500/50 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-green-500 transition-colors">Resolved</p>
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground group-hover:text-green-500 transition-colors">
                  {stats.resolved}
                </p>
              </div>

              {/* Escalated */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('Escalated')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('Escalated')}
                className="bg-card rounded-lg px-4 py-6 border border-border hover:border-orange-500/50 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-orange-500 transition-colors">
                    Escalated
                  </p>
                  <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
                    <RefreshCw size={20} className="text-orange-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground group-hover:text-orange-500 transition-colors">
                  {stats.escalated}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Confirm Delete Dialog */}
      {/* Transfer/Deletion Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmMode === 'transfer' ? 'Transfer request' : 'Delete query?'}
        message={
          confirmMode === 'transfer'
            ? `You have a transfer request for petition ${pendingPetitionId}${
                transferInfo?.from?.name ? ` from ${transferInfo.from.name}` : ''
              }${
                transferInfo?.reason
                  ? `.
Reason: ${transferInfo.reason}`
                  : '.'
              } Accept to take ownership or ignore to decline.`
            : 'Delete this query permanently? This action cannot be undone.'
        }
        confirmText={confirmMode === 'transfer' ? 'Accept' : 'Delete'}
        cancelText={confirmMode === 'transfer' ? 'Ignore' : 'Cancel'}
        loading={confirmMode === 'transfer' ? isAccepting : isDeleting}
        onConfirm={
          confirmMode === 'transfer'
            ? async () => {
                // Accept transfer
                try {
                  await acceptQuery(pendingPetitionId).unwrap();
                  toast.success('Transfer accepted');
                  play();
                  setConfirmOpen(false);
                  const userRole = currentUser?.role?.toLowerCase();
                  const navId = pendingPetitionId;
                  setPendingPetitionId(null);
                  setTransferInfo(null);
                  setConfirmMode(null);
                  refetch();
                  setTimeout(() => navigate(`/${userRole}/query/${navId}`), 300);
                } catch (err) {
                  toast.error(err?.data?.message || 'Failed to accept transfer');
                }
              }
            : confirmDelete
        }
        onCancel={() => {
          if (
            (confirmMode === 'transfer' && isAccepting) ||
            (confirmMode === 'delete' && isDeleting)
          )
            return;
          setConfirmOpen(false);
          setPendingPetitionId(null);
          setTransferInfo(null);
          setConfirmMode(null);
        }}
      />
    </div>
  );
}

// Helper to shorten names for chips
function shortName(name) {
  if (!name) return 'N/A';
  const parts = String(name).trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 10);
  return `${parts[0]} ${parts[1][0]}.`;
}
