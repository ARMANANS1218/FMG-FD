// UniversalAppbar.js
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar as MuiAppBar,
  Box,
  Toolbar,
  IconButton,
  Menu,
  Avatar,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
  Typography,
  Switch,
  CssBaseline,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Bell,
  Sun,
  Moon,
  Maximize,
  Minimize,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Sidebar from '../common/Sidebar';
import ProfileCard from '../common/ProfileCard';
import ColorModeContext from '../../context/ColorModeContext';

import { useGetProfileQuery, useToggleBreakMutation } from '../../features/auth/authApi';
import { useGetAllQueriesQuery } from '../../features/query/queryApi';
import StyledBadge from '../common/StyledBadge';
import Notification from '../common/Notification';
import QueryNotificationPopup from '../QueryNotificationPopup';
import { toast } from 'react-toastify';
import { IMG_PROFILE_URL, API_URL } from '../../config/api';
import { useNotificationSoundContext } from '../../context/NotificationSoundContext';
import { getQuerySocket } from '../../socket/querySocket';

const drawerWidth = 260;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: 10,
  ...(open && {
    marginLeft: `${drawerWidth}px`,
    width: `calc(100% - ${drawerWidth}px)`,
  }),
}));

const UniversalAppbar = ({ children }) => {
  const isLaptop = useMediaQuery('(min-width:1024px)');
  const [open, setOpen] = useState(false); // Start collapsed by default
  const [sidebarWidth, setSidebarWidth] = useState(64); // Track sidebar width
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { data, refetch } = useGetProfileQuery();
  const [toggleBreak, { isLoading }] = useToggleBreakMutation();
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } = useNotificationSoundContext();

  const agent = data?.data;
  const role = data?.data?.role;
  // console.log("role", role);

  const navigate = useNavigate();
  const { data: queriesCountData, refetch: refetchQueries } = useGetAllQueriesQuery({ limit: 1 });
  const pendingCount = queriesCountData?.data?.counts?.pending || 0;

  // Avatar source logic (same as Profile component)
  const avatarSrc = useMemo(() => {
    if (!agent?.profileImage) return '';
    // Backend may now store full Cloudinary URL; if so, use directly
    if (agent.profileImage?.startsWith('http')) return agent.profileImage;
    return `${IMG_PROFILE_URL}/${agent.profileImage}`;
  }, [agent?.profileImage]);

  // Optimized Hybrid Timer: LocalStorage (Instant) + Backend (Sync)
  // 1. Initialize from LocalStorage (if available) to show time immediately
  const [activeSeconds, setActiveSeconds] = useState(() => {
    const saved = localStorage.getItem('activeTimerSeconds');
    return saved ? parseFloat(saved) : 0;
  });

  const [breakMenuAnchor, setBreakMenuAnchor] = useState(null);
  const [breakReason, setBreakReason] = useState('');

  const breakOptions = [
    { label: 'Lunch', value: 'lunch', color: '#ef4444' },
    { label: 'Coffee Break', value: 'coffee', color: '#f59e0b' },
    { label: 'Meeting', value: 'meeting', color: '#8b5cf6' },
    { label: 'Personal', value: 'personal', color: '#3b82f6' },
    { label: 'Other', value: 'other', color: '#6366f1' },
  ];

  // SYNC: Fetch from backend every 5 minutes (Very low network usage)
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !agent) return;

        const response = await fetch(`${API_URL}/api/v1/user/active-time`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status && data.data) {
            // Backend is source of truth - correct the local time
            const backendSeconds = data.data.activeTimeMinutes * 60;
            setActiveSeconds(backendSeconds);
            localStorage.setItem('activeTimerSeconds', backendSeconds.toString());
          }
        }
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    };

    syncWithBackend(); // Sync on mount
    const interval = setInterval(syncWithBackend, 300000); // Sync every 5 minutes

    return () => clearInterval(interval);
  }, [agent]);

  // Listen for socket events to update status in real-time
  useEffect(() => {
    const socket = getQuerySocket();
    if (!socket) return;

    const handleStatusUpdate = () => {
      console.log('🔄 Socket event received, refetching profile for status update...');
      refetch();
    };

    const handleQueryUpdate = () => {
      refetchQueries();
    };

    socket.on('query-accepted', handleStatusUpdate);
    socket.on('work-status-changed', handleStatusUpdate);
    socket.on('new-pending-query', handleQueryUpdate);
    socket.on('query-status-updated', handleQueryUpdate);

    return () => {
      socket.off('query-accepted', handleStatusUpdate);
      socket.off('work-status-changed', handleStatusUpdate);
      socket.off('new-pending-query', handleQueryUpdate);
      socket.off('query-status-updated', handleQueryUpdate);
    };
  }, [refetch, refetchQueries]);

  // TICK: Increment every second & Save to LocalStorage (Real-time display)
  useEffect(() => {
    if (agent?.workStatus !== 'active' && agent?.workStatus !== 'busy') return;

    const interval = setInterval(() => {
      setActiveSeconds((prev) => {
        const newVal = prev + 1;
        localStorage.setItem('activeTimerSeconds', newVal.toString());
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [agent?.workStatus]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
  };

  // Handle break selection
  const handleBreakSelect = async (reason) => {
    try {
      setBreakReason(reason);
      setBreakMenuAnchor(null);

      // First trigger the break
      const res = await toggleBreak().unwrap();
      toast.success(`Break started - ${reason}`);

      // ✅ FIX: Immediately fetch accumulated time when GOING on break
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/v1/user/active-time`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.status && data.data) {
              const backendSeconds = data.data.activeTimeMinutes * 60;
              setActiveSeconds(backendSeconds);
              localStorage.setItem('activeTimerSeconds', backendSeconds.toString());
              console.log('✅ Fetched on break:', data.data.activeTimeMinutes, 'minutes');
            }
          }
        } catch (error) {
          console.error('Failed to fetch active time on break:', error);
        }
      }

      refetch();
    } catch (error) {
      toast.error('Failed to start break');
    }
  };

  // Handle toggle (Check-in/Check-out)
  const handleToggle = async () => {
    try {
      if (agent?.workStatus === 'active') {
        // Show break options dropdown
        const button = document.getElementById('break-button');
        setBreakMenuAnchor(button);
      } else if (agent?.workStatus === 'break') {
        // Resume from break - return to active
        const res = await toggleBreak().unwrap();
        toast.success('✅ Resumed from break');
        setBreakReason('');

        // ✅ FIX: Immediately fetch active time from backend when resuming
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch(`${API_URL}/api/v1/user/active-time`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.status && data.data) {
                const backendSeconds = data.data.activeTimeMinutes * 60;
                setActiveSeconds(backendSeconds);
                localStorage.setItem('activeTimerSeconds', backendSeconds.toString());
              }
            }
          } catch (error) {
            console.error('Failed to fetch active time on resume:', error);
          }
        }

        refetch();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Handle check out (end of day)

  // Handle Check In

  useEffect(() => {
    setOpen(isLaptop);
  }, [isLaptop]);

  // Refetch profile data when profile menu is opened to ensure latest image is displayed
  useEffect(() => {
    if (profileAnchorEl) {
      refetch();
    }
  }, [profileAnchorEl, refetch]);

  // Fullscreen functionality
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      toast.error('Failed to toggle fullscreen mode');
    }
  };

  const handleDrawerToggle = () => setOpen((prev) => !prev);

  const handleSidebarWidthChange = (width) => {
    setSidebarWidth(width);
  };

  // Page Header Logic
  const location = window.location; // Using window.location since useLocation might be in parent
  // But wait, UniversalAppbar is likely inside Router.
  // checking imports... yes, useLocation is likely available or partially used.
  // Actually, let's use the one from react-router-dom if imported, or add it.
  // It was imported in line 1.
  const { pathname } = useLocation();

  const getPageTitle = (path) => {
    // Specific Overrides with Subtitles
    const headers = {
      '/admin': {
        title: 'Admin Dashboard',
        subtitle: 'Real-time system overview with live analytics',
      },
      '/agent': { title: 'Agent Dashboard', subtitle: 'Your daily tasks and performance' },
      '/qa': { title: 'QA Dashboard', subtitle: 'Quality assurance overview' },
      '/tl': { title: 'Team Leader Dashboard', subtitle: 'Team performance monitoring' },
      '/management': {
        title: 'Management Dashboard',
        subtitle: 'Company-wide overview and reports',
      },

      '/admin/queries': {
        title: 'Query Management',
        subtitle: 'Manage customer queries and support tickets',
      },
      '/agent/queries': { title: 'My Queries', subtitle: 'Handle your assigned queries' },

      '/admin/email-config': {
        title: 'Organization Email Config',
        subtitle: 'Configure email integration settings',
      },
      '/admin/organization-ip-config': {
        title: 'Organization IP Config',
        subtitle: 'Manage IP restrictions',
      },

      '/admin/create-employee': {
        title: 'Create Employee',
        subtitle: 'Register a new team member',
      },
      '/admin/employees': { title: 'Employee Management', subtitle: 'Manage staff and roles' },

      '/admin/location-settings': {
        title: 'Location Settings',
        subtitle: 'Configure allowed locations',
      },
      '/admin/location-access': { title: 'Location Access', subtitle: 'Monitor access logs' },

      '/admin/faq-management': {
        title: 'FAQs Management',
        subtitle: 'Manage frequently asked questions',
      },
      '/admin/training-material': {
        title: 'Training Material',
        subtitle: 'Resources for agent training',
      },
      '/admin/customers': {
        title: 'Customer Management',
        subtitle: 'View and manage customer data',
      },

      '/admin/ticketing/my-inbox': { title: 'Ticket Inbox', subtitle: 'Manage support tickets' },
    };

    // Return exact match
    if (headers[path]) return headers[path];

    // Check for nested routes
    if (path.includes('/ticketing'))
      return { title: 'Ticketing System', subtitle: 'Support Ticket Management' };
    if (path.includes('/reports'))
      return { title: 'Reports & Analytics', subtitle: 'Performance insights' };
    if (path.includes('/attendance'))
      return { title: 'Attendance Management', subtitle: 'Track shifts and attendance' };

    // Default Fallback
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) return { title: 'Dashboard', subtitle: '' };

    // Capitalize fallback
    const title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    return { title, subtitle: '' };
  };

  const { title: pageTitle, subtitle: pageSubtitle } = getPageTitle(pathname);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <CssBaseline />
      {/* Query Notification Popup for Agent/QA */}
      <QueryNotificationPopup />

      {/* Sidebar - Fixed width using padding-left on main container */}
      <Sidebar
        open={open}
        handleDrawerClose={() => setOpen(false)}
        role={role}
        onSidebarWidthChange={handleSidebarWidthChange}
      />

      {/* Right Section - Header + Main Content, positioned after sidebar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: { xs: '100%', lg: `calc(100% - ${sidebarWidth}px)` },
          marginLeft: { xs: 0, lg: `${sidebarWidth}px` },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* AppBar - Full width of container */}
        <AppBar
          elevation={0}
          position="fixed"
          open={open}
          className="bg-background border-b border-border shadow-sm"
          sx={{
            backgroundColor: 'rgb(var(--background))',
            backdropFilter: 'blur(12px)',
            width: { xs: '100%', lg: `calc(100% - ${sidebarWidth}px)` },
            marginLeft: { xs: 0, lg: `${sidebarWidth}px` },
            top: 0,
            zIndex: 10,
            transition:
              'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Toolbar
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              minHeight: 64,
            }}
          >
            <IconButton
              onClick={handleDrawerToggle}
              className="text-primary hover:bg-primary/10"
              size="small"
            >
              <MenuIcon size={20} />
            </IconButton>

            {/* Page Title & Subtitle - Added */}
            <Box sx={{ ml: 2, display: { xs: 'none', sm: 'flex' }, flexDirection: 'column' }}>
              <Typography
                variant="subtitle1"
                className="text-foreground"
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {pageTitle}
              </Typography>
              {pageSubtitle && (
                <Typography
                  variant="caption"
                  className="text-muted-foreground dark:text-gray-300"
                  sx={{ lineHeight: 1 }}
                >
                  {pageSubtitle}
                </Typography>
              )}
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
              {/* Show Timer, Status, and Notifications for all roles EXCEPT Admin and Management */}
              {!['Admin', 'Management'].includes(role) && (
                <>
                  {/* Timer Display */}
                  <Tooltip title={`Total active time today: ${formatTime(activeSeconds)}`}>
                    <Stack direction="row" alignItems="center" spacing={0.25}>
                      <Clock
                        size={14}
                        className={
                          agent?.workStatus === 'active'
                            ? 'text-green-600 '
                            : agent?.workStatus === 'busy'
                              ? 'text-primary dark:text-orange-400'
                              : 'text-red-600 dark:text-red-400'
                        }
                      />
                      <Typography
                        variant="caption"
                        className={
                          agent?.workStatus === 'active'
                            ? 'text-green-600 '
                            : agent?.workStatus === 'busy'
                              ? 'text-primary dark:text-orange-400'
                              : 'text-red-600 dark:text-red-400'
                        }
                        sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        {formatTime(activeSeconds)}
                      </Typography>
                    </Stack>
                  </Tooltip>

                  {/* Status Toggle Switch */}
                  <Tooltip
                    title={
                      agent?.workStatus === 'active'
                        ? 'Active - Toggle to switch status'
                        : agent?.workStatus === 'busy'
                          ? 'Busy - Toggle to switch status'
                          : 'On Break - Toggle to switch status'
                    }
                  >
                    <Switch
                      checked={agent?.workStatus === 'active'}
                      onChange={(e) => {
                        if (e.target.checked && agent?.workStatus !== 'active') {
                          handleToggle();
                        } else if (!e.target.checked && agent?.workStatus === 'active') {
                          const button = document.getElementById('break-button');
                          setBreakMenuAnchor(button);
                        }
                      }}
                      size="small"
                      sx={{
                        width: 36,
                        height: 20,
                        padding: 0,
                        '& .MuiSwitch-switchBase': {
                          padding: 0,
                          margin: '2px',
                          '&.Mui-checked': {
                            transform: 'translateX(16px)',
                            color: '#fff',
                            '& + .MuiSwitch-track': {
                              backgroundColor: '#22c55e',
                              opacity: 1,
                            },
                          },
                        },
                        '& .MuiSwitch-thumb': {
                          width: 16,
                          height: 16,
                        },
                        '& .MuiSwitch-track': {
                          borderRadius: 10,
                          backgroundColor: '#ef4444',
                          opacity: 1,
                        },
                      }}
                    />
                  </Tooltip>

                  {/* Status Button */}
                  <Tooltip
                    title={
                      agent?.workStatus === 'active'
                        ? 'Click to take a break'
                        : agent?.workStatus === 'busy'
                          ? 'You are currently busy'
                          : 'Click to resume work'
                    }
                  >
                    <Box
                      id="break-button"
                      onClick={
                        agent?.workStatus === 'active'
                          ? (e) => setBreakMenuAnchor(e.currentTarget)
                          : agent?.workStatus === 'busy'
                            ? undefined
                            : handleToggle
                      }
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.25,
                        borderRadius: '20px',
                        bgcolor:
                          agent?.workStatus === 'active'
                            ? 'rgba(34, 197, 94, 0.1)'
                            : agent?.workStatus === 'busy'
                              ? 'rgba(249, 115, 22, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid',
                        borderColor:
                          agent?.workStatus === 'active'
                            ? 'rgba(34, 197, 94, 0.2)'
                            : agent?.workStatus === 'busy'
                              ? 'rgba(249, 115, 22, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                        cursor: agent?.workStatus === 'busy' ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor:
                            agent?.workStatus === 'active'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : agent?.workStatus === 'busy'
                                ? 'rgba(249, 115, 22, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                          transform: agent?.workStatus === 'busy' ? 'none' : 'translateY(-1px)',
                        },
                      }}
                    >
                      <Clock
                        size={14}
                        className={
                          agent?.workStatus === 'active'
                            ? 'text-green-600'
                            : agent?.workStatus === 'busy'
                              ? 'text-orange-600'
                              : 'text-red-600'
                        }
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color:
                            agent?.workStatus === 'active'
                              ? 'success.main'
                              : agent?.workStatus === 'busy'
                                ? 'warning.main'
                                : 'error.main',
                        }}
                      >
                        {agent?.workStatus === 'active'
                          ? 'Active'
                          : agent?.workStatus === 'busy'
                            ? 'Busy'
                            : 'On Break'}
                      </Typography>
                    </Box>
                  </Tooltip>

                  {/* Vertical Separator */}
                  <Box sx={{ height: 24, mx: 0.5, borderLeft: 1, borderColor: 'divider' }} />

                  {/* Queries/Bell Notification */}
                  <Tooltip title="Pending Queries">
                    <IconButton
                      className="text-gray-700 hover:bg-muted dark:hover:bg-slate-700"
                      size="small"
                      onClick={() => navigate('/agent/queries')}
                    >
                      <Box sx={{ position: 'relative', display: 'flex' }}>
                        <Bell size={18} />
                        {pendingCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </span>
                        )}
                      </Box>
                    </IconButton>
                  </Tooltip>

                  <Tooltip
                    title={soundEnabled ? 'Mute Notification Sounds' : 'Unmute Notification Sounds'}
                  >
                    <IconButton
                      onClick={() => {
                        setSoundEnabled(!soundEnabled);
                        toast.success(
                          soundEnabled
                            ? 'Notification sounds muted'
                            : 'Notification sounds enabled',
                          {
                            position: 'top-center',
                            autoClose: 2000,
                          }
                        );
                      }}
                      className="text-gray-700  hover:bg-muted dark:hover:bg-slate-700"
                      size="small"
                    >
                      {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </IconButton>
                  </Tooltip>

                  {/* Vertical Separator */}
                  <Box sx={{ height: 24, mx: 0.5, borderLeft: 1, borderColor: 'divider' }} />
                </>
              )}

              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                <IconButton
                  onClick={toggleFullscreen}
                  className="text-gray-700  hover:bg-muted dark:hover:bg-slate-700"
                  size="small"
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </IconButton>
              </Tooltip>

              <Tooltip title={theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                <IconButton
                  onClick={colorMode.toggleColorMode}
                  className="text-gray-700  hover:bg-muted dark:hover:bg-slate-700"
                  size="small"
                >
                  {theme.palette.mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </IconButton>
              </Tooltip>

              {/* Vertical Separator */}
              <Box sx={{ height: 24, mx: 1, borderLeft: 1, borderColor: 'divider' }} />

              <Tooltip title="Profile">
                <IconButton
                  size="small"
                  onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                  className="hover:bg-muted dark:hover:bg-slate-700 flex-shrink-0"
                >
                  <StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant={agent?.is_active === true ? 'dot' : 'none'}
                  >
                    <Avatar
                      alt={agent?.first_name}
                      src={avatarSrc}
                      key={avatarSrc}
                      sx={{ height: '30px', width: '30px' }}
                    />
                  </StyledBadge>
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Main Content Area - Only this scrolls */}
        <Box
          component="main"
          className="flex-grow bg-background "
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: '100%',
            paddingTop: '64px',
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Break Reasons & Status Menu */}
      <Menu
        anchorEl={breakMenuAnchor}
        open={Boolean(breakMenuAnchor)}
        onClose={() => setBreakMenuAnchor(null)}
        sx={{ mt: 1 }}
        PaperProps={{
          sx: {
            minWidth: 220,
            backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#111827',
            color: theme.palette.mode === 'light' ? '#000000' : '#ffffff',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#6b7280' }}>
            Select Action
          </Typography>
        </Box>

        {/* Break Reasons */}
        <Box sx={{ borderBottom: '1px solid #e5e7eb' }}>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              pt: 1,
              display: 'block',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.75rem',
            }}
          >
            TAKE A BREAK
          </Typography>
          {breakOptions.map((option) => (
            <Box
              key={option.value}
              onClick={() => handleBreakSelect(option.label)}
              sx={{
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '0.9rem',
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: option.color,
                }}
              />
              {option.label}
            </Box>
          ))}
        </Box>
      </Menu>

      {/* Profile Menu */}
      <Menu
        elevation={0}
        sx={{ mt: 1.5 }}
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
      >
        <ProfileCard agent={{ ...data }} role={role} />
      </Menu>

      {/* Notifications Menu */}
      <Menu
        sx={{ mt: 2 }}
        anchorEl={notifAnchorEl}
        open={Boolean(notifAnchorEl)}
        onClose={() => setNotifAnchorEl(null)}
      >
        <Notification />
      </Menu>
    </Box>
  );
};

export default UniversalAppbar;
