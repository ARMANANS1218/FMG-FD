import React, { useState, useContext, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import ColorModeContext from '../../context/ColorModeContext';
import { 
  BarChart3, 
  Building2, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  Moon,
  Sun,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  MapPinned
} from 'lucide-react';

const SuperAdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { superAdminData, logoutSuperAdmin } = useSuperAdmin();
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAction, setHeaderAction] = useState(null);

  const isDark = mode === 'dark';

  const navigation = [
    { name: 'Dashboard', href: '/superadmin/dashboard', icon: BarChart3 },
    { name: 'Organizations', href: '/superadmin/organizations', icon: Building2 },
    { name: 'Location Status', href: '/superadmin/location-summary', icon: MapPin },
    { name: 'Location Settings', href: '/superadmin/location-settings', icon: MapPinned },
  ];

  // Map routes to header info
  const getPageHeaderInfo = (pathname) => {
    if (pathname.includes('/dashboard')) {
      return { title: 'Dashboard', subtitle: 'Platform Overview' };
    }
    if (pathname.includes('/organizations')) {
      return { title: 'Organizations', subtitle: 'Manage Tenants' };
    }
    if (pathname.includes('/location-summary')) {
      return { title: 'Location Status', subtitle: 'Access Summary' };
    }
    if (pathname.includes('/location-settings')) {
      return { title: 'Location Settings', subtitle: 'Configure Restrictions' };
    }
    return { title: 'SuperAdmin', subtitle: '' };
  };

  const { title, subtitle } = getPageHeaderInfo(location.pathname);

  // Clear header action on route change
  useEffect(() => {
    setHeaderAction(null);
  }, [location.pathname]);


  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logoutSuperAdmin();
      navigate('/superadmin/login');
    }
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0 border-r border-border">
        <div className={`flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          <div className="flex flex-col h-screen bg-background">
            {/* Logo & Toggle */}
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-4'} h-16 bg-primary/5 border-b border-border`}>
              {!sidebarCollapsed && (
                <div className="flex items-center">
                  <ShieldCheck className="w-6 h-6 text-foreground mr-2" />
                  <span className="text-lg font-bold text-foreground">SuperAdmin</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground rounded-md transition"
                title={sidebarCollapsed ? 'Expand' : 'Collapse'}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 py-6 space-y-2 ${sidebarCollapsed ? 'px-2' : 'pl-4 pr-0'}`}>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                
                // Active state styling for "Connect to Page" effect
                const activeClasses = sidebarCollapsed
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-background text-primary font-bold border-y border-l border-border border-r-0 -mr-[1px] z-10 shadow-sm rounded-l-full rounded-r-none';

                // Inactive state styling
                const inactiveClasses = sidebarCollapsed
                  ? 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary mr-4 rounded-full';

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center group py-3 text-sm font-medium transition-all duration-200 relative ${
                      sidebarCollapsed ? 'justify-center rounded-xl' : 'pl-4'
                    } ${isActive ? activeClasses : inactiveClasses}`}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    {!sidebarCollapsed && isActive && (
                      <>
                        {/* Top Curve - connects top border to vertical line */}
                        <div className="absolute -top-4 right-0 w-4 h-4 pointer-events-none overflow-hidden z-20">
                          <div className="absolute inset-0 bg-background" />
                          <svg className="absolute inset-0 w-full h-full text-[rgb(var(--border))] fill-transparent" viewBox="0 0 16 16">
                            <path d="M 15.5 0 A 15.5 15.5 0 0 1 0 15.5" stroke="currentColor" strokeWidth="1" fill="none" />
                          </svg>
                        </div>
                        {/* Mask to hide the top-right corner of the actual border-top */}
                        <div className="absolute -top-[1px] right-0 w-4 h-[2px] bg-background z-20" />

                        {/* Bottom Curve */}
                        <div className="absolute -bottom-4 right-0 w-4 h-4 pointer-events-none overflow-hidden z-20">
                          <div className="absolute inset-0 bg-background" />
                          <svg className="absolute inset-0 w-full h-full text-[rgb(var(--border))] fill-transparent" viewBox="0 0 16 16">
                             <path d="M 0 0.5 A 15.5 15.5 0 0 1 15.5 16" stroke="currentColor" strokeWidth="1" fill="none" />
                          </svg>
                        </div>
                         {/* Mask for bottom border */}
                        <div className="absolute -bottom-[1px] right-0 w-4 h-[2px] bg-background z-20" />
                      </>
                    )}

                    <Icon className={`w-5 h-5 transition-colors ${
                      !sidebarCollapsed ? 'mr-3' : ''
                    } ${
                      isActive && sidebarCollapsed ? 'text-primary-foreground' : 
                      isActive ? 'text-primary' : 
                      'text-muted-foreground group-hover:text-primary'
                    }`} />
                    
                    {!sidebarCollapsed && (
                      <span className={`tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>
                        {item.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile - Simplified */}
            <div className="flex-shrink-0 border-t border-border p-4">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="flex-shrink-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center ring-2 ring-background">
                    <span className="text-white text-sm font-bold">
                      {superAdminData?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-foreground truncate">{superAdminData?.name}</p>
                    <p className="text-xs text-muted-foreground truncate opacity-80">{superAdminData?.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* Top Header - Desktop & Mobile */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center flex-1">
             {/* Mobile Menu Toggle */}
             <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-4 p-2 rounded-md text-primary hover:bg-primary/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title & Subtitle */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground hidden md:block">{subtitle}</p>}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            
            {/* Dynamic Header Action (e.g. Buttons from pages) */}
            {headerAction && (
              <div className="mr-4">
                {headerAction}
              </div>
            )}

            <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>

            <button
              onClick={toggleColorMode}
              className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/50">
          <Outlet context={{ setHeaderAction }} />
        </main>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar Panel */}
        <div
          className={`fixed inset-y-0 left-0 flex flex-col w-72 bg-background transform transition-transform duration-300 shadow-2xl ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Logo */}
          <div className="flex items-center justify-between h-16 px-6 bg-primary/5 border-b border-border">
            <div className="flex items-center">
              <ShieldCheck className="w-6 h-6 text-foreground mr-2" />
              <span className="text-lg font-bold text-foreground">SuperAdmin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-foreground hover:bg-card'
                  }`}
                >
                  <Icon className="mr-3 w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
