import React, { useEffect, useState, useContext } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import ColorModeContext from '../../context/ColorModeContext';

const ThemeToggle = () => {
  const colorModeContext = useContext(ColorModeContext);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(initialDark);
    
    // Apply theme to document
    applyTheme(initialDark);
  }, []);

  // Sync with ColorModeContext if available
  useEffect(() => {
    if (colorModeContext?.mode) {
      const contextIsDark = colorModeContext.mode === 'dark';
      if (contextIsDark !== isDark) {
        setIsDark(contextIsDark);
        applyTheme(contextIsDark);
      }
    }
  }, [colorModeContext?.mode]);

  const applyTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    
    applyTheme(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    // Also toggle via context if available
    if (colorModeContext?.toggleColorMode) {
      colorModeContext.toggleColorMode();
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 bg-card hover:bg-card-hover rounded-full shadow-lg border border-border transition-all duration-200 hover:scale-110"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FaSun className="w-5 h-5 text-foreground" />
      ) : (
        <FaMoon className="w-5 h-5 text-foreground" />
      )}
    </button>
  );
};

export default ThemeToggle;
