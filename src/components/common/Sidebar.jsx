import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { menuData } from './menuData';
import axios from 'axios';
import { API_URL } from '../../config/api';

// TailwindCSS Sidebar (no MUI). Supports nested menus, active highlight, collapse on mobile.
export default function Sidebar({
  open,
  onClose,
  role = 'Agent',
  width = 260,
  onSidebarWidthChange,
}) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [organizationName, setOrganizationName] = useState('LIVE CHAT CRM');

  // Fetch organization name on component mount
  useEffect(() => {
    const fetchOrganizationName = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${API_URL}/api/v1/user/organization-info`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.data.status && response.data.data) {
            setOrganizationName(response.data.data.name || 'LIVE CHAT CRM');
          }
        }
      } catch (error) {
        console.error('Error fetching organization name:', error);
        // Keep default name if fetch fails
      }
    };

    fetchOrganizationName();
  }, []);

  // Notify parent of width changes
  useEffect(() => {
    if (onSidebarWidthChange) {
      const currentWidth = open || isHovered ? width : 64;
      onSidebarWidthChange(currentWidth);
    }
  }, [open, isHovered, width, onSidebarWidthChange]);

  useEffect(() => {
    // auto-open parents for active route
    const sections = menuData[role] || [];
    const newState = {};
    const path = location.pathname;
    sections.forEach((section, si) => {
      (section.items || []).forEach((item, i) => {
        if ((item.route && path.startsWith(item.route)) || item.subMenu || item.nestedSubMenu) {
          if (item.subMenu) {
            newState[`0-${item.name}`] = true;
            item.subMenu.forEach((sub) => {
              if (sub.route && path.startsWith(sub.route)) {
                newState[`1-${sub.name}`] = true;
              }
            });
          }
        }
      });
    });
    setOpenMenus((prev) => ({ ...prev, ...newState }));
  }, [location.pathname, role]);

  const toggle = (key) => {
    setOpenMenus((prev) => {
      const [level] = key.split('-');
      const isOpen = prev[key];
      const newState = { ...prev };

      // Close all siblings at the same level
      Object.keys(newState).forEach((k) => {
        if (k.startsWith(`${level}-`)) {
          newState[k] = false;
        }
      });

      // Toggle the clicked item
      newState[key] = !isOpen;
      return newState;
    });
  };

  // Determine if sidebar should be expanded (either open prop on mobile or hovered on desktop)
  const isExpanded = open || isHovered;

  const NavItem = ({ item, level = 0 }) => {
    // For Dashboard, check exact route or direct child routes (not nested reports, etc)
    const isDashboard =
      item.route === '/admin' ||
      item.route === '/agent' ||
      item.route === '/qa' ||
      item.route === '/tl' ||
      item.route === '/customer' ||
      item.route === '/management';
    const isActive = item.route
      ? isDashboard
        ? location.pathname === item.route // Exact match for Dashboard
        : location.pathname.startsWith(item.route) // Prefix match for other routes
      : false;
    const hasChildren = !!(item.subMenu || item.nestedSubMenu);
    const key = `${level}-${item.name}`;
    const isOpen = openMenus[key];

    // Padding for hierarchy indentation
    const paddingLeft = level === 0 ? 'pl-4' : level === 1 ? 'pl-8' : 'pl-12';

    // Determine styles based on state
    // If collpased (Mini sidebar)
    if (!isExpanded) {
      return item.route ? (
        <Link
          to={item.route}
          className={`flex justify-center py-3 my-1 mx-2 rounded-xl transition-all duration-200 group relative ${
            isActive
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
          }`}
        >
          {item.icon && <item.icon size={20} />}
          <span className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-border">
            {item.name}
          </span>
        </Link>
      ) : (
        <div className="flex justify-center py-3 my-1 mx-2 text-muted-foreground">
          {item.icon && <item.icon size={20} />}
        </div>
      );
    }

    // Expanded State Styles
    // Active Item Style (Connected to content)
    const activeClasses = `
      bg-background text-primary font-bold
      border-y border-l border-border border-r-0 
      mr-0 z-20 shadow-sm rounded-l-full rounded-r-none relative
    `;

    // Inactive Item Style
    const inactiveClasses = `
      text-muted-foreground font-medium
      hover:bg-primary/10 hover:text-primary 
      mr-4 rounded-full
    `;

    const wrapperClasses = `
      flex items-center justify-between py-3 transition-all duration-200 relative cursor-pointer
      ${paddingLeft}
      ${isActive ? activeClasses : inactiveClasses}
    `;

    const content = (
      <>
        {/* Connected Effect Curves (Only for Active items) */}
        {isActive && (
          <>
            {/* Top Curve */}
            <div className="absolute -top-4 right-0 w-4 h-4 pointer-events-none overflow-hidden z-20">
              <div className="absolute inset-0 bg-background" />
              <svg
                className="absolute inset-0 w-full h-full text-[rgb(var(--border))] fill-transparent"
                viewBox="0 0 16 16"
              >
                <path
                  d="M 15.5 0 A 15.5 15.5 0 0 1 0 15.5"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
            </div>
            <div className="absolute -top-[1px] right-0 w-4 h-[2px] bg-background z-20" />

            {/* Bottom Curve */}
            <div className="absolute -bottom-4 right-0 w-4 h-4 pointer-events-none overflow-hidden z-20">
              <div className="absolute inset-0 bg-background" />
              <svg
                className="absolute inset-0 w-full h-full text-[rgb(var(--border))] fill-transparent"
                viewBox="0 0 16 16"
              >
                <path
                  d="M 0 0.5 A 15.5 15.5 0 0 1 15.5 16"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
            </div>
            <div className="absolute -bottom-[1px] right-0 w-4 h-[2px] bg-background z-20" />
          </>
        )}

        <div className="flex items-center gap-3 min-w-0">
          {item.icon && (
            <item.icon
              size={18}
              className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
            />
          )}
          <span className="truncate text-sm">{item.name}</span>
        </div>

        {hasChildren && (
          <span
            className={`pr-3 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </>
    );

    if (hasChildren) {
      return (
        <div className="select-none mb-1">
          <div onClick={() => toggle(key)} className={wrapperClasses}>
            {content}
          </div>
          <div
            className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} overflow-hidden`}
          >
            <div className="min-h-0 space-y-1 mt-1">
              {(item.subMenu || item.nestedSubMenu).map((child) => (
                <NavItem key={child.name} item={child} level={level + 1} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (item.route) {
      return (
        <div className="mb-1">
          <Link
            to={item.route}
            onClick={() => {
              if (window.innerWidth < 1024) onClose?.();
            }}
            className={wrapperClasses}
          >
            {content}
          </Link>
        </div>
      );
    }

    return <div className={wrapperClasses}>{content}</div>;
  };

  const sections = menuData[role] || [];

  return (
    <>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 h-screen bg-background border-r-0 z-30 transition-all duration-300 ease-out`}
        style={{
          width: isExpanded ? width : 64,
          boxShadow: isExpanded && !open ? '4px 0 12px rgba(0, 0, 0, 0.05)' : 'none',
        }}
      >
        {/* Border Line - Absolute to allow overlap */}
        <div className="absolute top-0 right-0 w-[1px] h-full bg-border z-0" />

        {/* Logo Area */}
        <div className="h-16 border-b border-border flex items-center bg-primary/5 px-4 overflow-hidden relative z-10">
          <div
            className={`flex items-center gap-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold">
              OD
            </div>
            <span className="font-bold text-foreground text-sm whitespace-nowrap truncate">
              {organizationName}
            </span>
          </div>
          {!isExpanded && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto text-white font-bold">
              OD
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`relative z-10 py-4 space-y-4 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-hide ${isExpanded ? 'pl-4 pr-0' : 'px-0'}`}
        >
          {sections.map((section) => (
            <div key={section.label}>
              {script_label(section.label, isExpanded)}
              <div className="space-y-0.5">
                {(section.items || []).map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );

  function script_label(label, expanded) {
    if (!expanded) return <div className="h-4"></div>;
    return (
      <div className="px-4 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 mt-2">
        {label}
      </div>
    );
  }
}
