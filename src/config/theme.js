/**
 * Theme Configuration
 * Centralized color and styling constants
 */

export const THEME_COLORS = {
  light: {
    primary: '#A594F9',
    secondary: '#CDC1FF',
    accent: '#E5D9F2',
    surface: '#F5EFFF',
    background: '#FFFFFF',
    foreground: '#1e1611',
  },
  dark: {
    primary: '#A78295',      // Muted Mauve
    secondary: '#3F2E3E',    // Dark Purple
    accent: '#EFE1D1',       // Light Beige
    surface: '#3F2E3E',      // Dark Purple Surface
    background: '#331D2C',   // Darkest Purple
    foreground: '#EFE1D1',   // Light Beige Text
  },
};

export const CHART_COLORS = {
  light: [
    '#A594F9', // Primary Purple
    '#CDC1FF', // Medium Lavender
    '#E5D9F2', // Light Lavender
    '#F5EFFF', // Very Light
    '#8B5CF6', // Darker Purple
  ],
  dark: [
    '#A78295', // Muted Mauve
    '#EFE1D1', // Light Beige
    '#3F2E3E', // Dark Purple
    '#8B5C6C', // Lighter Mauve
    '#C7A2B5', // Very Light Mauve
  ],
};

export const STATUS_COLORS = {
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#3B82F6',
};

// Helper function to get current theme colors
export const getThemeColors = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return THEME_COLORS[isDark ? 'dark' : 'light'];
};

// Helper function to get chart colors based on theme
export const getChartColors = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return CHART_COLORS[isDark ? 'dark' : 'light'];
};

export default {
  THEME_COLORS,
  CHART_COLORS,
  STATUS_COLORS,
  getThemeColors,
  getChartColors,
};
