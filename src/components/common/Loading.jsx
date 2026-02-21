import React, { useContext } from 'react';
import { FourSquare } from 'react-loading-indicators';
import ColorModeContext from '../../context/ColorModeContext';

/**
 * Loading component using react-loading-indicators FourSquare
 * Honors Tailwind light/dark theme via ColorModeContext
 */
const Loading = ({ fullScreen = true, size = 'md', showText = false, message = 'Loading' }) => {
  const { mode } = useContext(ColorModeContext) || {};
  const isDark = mode === 'dark';

  // Map our size prop to library sizes
  const sizeMap = {
    sm: 'small',
    md: 'medium',
    lg: 'large',
  };

  // Theme-based color: dark/light from CSS variables
  // We'll use the primary color for the spinner to match brand
  const color = '#f97316'; // orange-500

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'
    : 'flex items-center justify-center';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center justify-center gap-2">
        <FourSquare
          color={color}
          size={sizeMap[size] || 'medium'}
          text=""
          textColor=""
        />

        {showText && (
          <div className="text-center mt-2">
            <p className="text-sm font-medium text-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">Please wait…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loading;
