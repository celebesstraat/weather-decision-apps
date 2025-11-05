import React, { useEffect, useState } from 'react';

interface MobileShellProps {
  children: React.ReactNode;
}

const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<string>('100vh');
  
  useEffect(() => {
    // Check if app is running in standalone mode (PWA)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    // Handle viewport height for mobile browsers
    const handleViewportHeight = () => {
      // Use the actual viewport height to account for mobile browser UI
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`${window.innerHeight}px`);
    };

    // Initial checks
    checkStandalone();
    handleViewportHeight();

    // Listen for changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);
    window.addEventListener('resize', handleViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleViewportHeight, 100); // Delay to ensure accurate measurement
    });

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
      window.removeEventListener('resize', handleViewportHeight);
      window.removeEventListener('orientationchange', handleViewportHeight);
    };
  }, []);

  // Add mobile-specific classes and styles
  const shellClasses = [
    'min-h-screen',
    'font-sans',
    'text-slate-800',
    'relative',
    isStandalone ? 'pwa-standalone' : '',
    // Add safe area padding for devices with notches
    'safe-area-padding',
  ].filter(Boolean).join(' ');

  const shellStyles: React.CSSProperties = {
    height: isStandalone ? viewportHeight : undefined,
    minHeight: viewportHeight,
    // Prevent overscroll on iOS
    overscrollBehavior: 'contain',
    // Prevent pull-to-refresh on mobile
    touchAction: 'pan-x pan-y',
    // Improve scrolling performance on mobile
    WebkitOverflowScrolling: 'touch',
    // Handle safe areas
    paddingTop: isStandalone ? 'env(safe-area-inset-top)' : undefined,
    paddingBottom: isStandalone ? 'env(safe-area-inset-bottom)' : undefined,
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
    // Force full viewport coverage in PWA
    width: '100vw',
    maxWidth: '100vw',
    overflow: 'hidden',
    position: 'relative',
  };

  useEffect(() => {
    // Inject mobile-specific styles
    const styleId = 'mobile-shell-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Dynamic viewport height using CSS custom properties */
        .min-h-screen {
          min-height: calc(var(--vh, 1vh) * 100);
        }
        
        /* PWA-specific styles */
        .pwa-standalone {
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
          height: 100vh !important;
          height: calc(var(--vh, 1vh) * 100) !important;
          width: 100vw !important;
          max-width: 100vw !important;
          overflow-x: hidden;
          overflow-y: auto;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        /* Safe area handling */
        .safe-area-padding {
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        
        /* Prevent zoom on inputs */
        @media screen and (max-width: 768px) {
          input, select, textarea {
            font-size: 16px !important;
            transform: scale(1);
            transition: none;
          }
        }
        
        /* Force full viewport on PWA */
        @media (display-mode: standalone) {
          html, body {
            height: 100vh !important;
            height: calc(var(--vh, 1vh) * 100) !important;
            width: 100vw !important;
            max-width: 100vw !important;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
        }
        
        /* Handle iPhone X+ safe areas */
        @supports (padding: max(0px)) {
          .safe-area-padding {
            padding-left: max(1rem, env(safe-area-inset-left));
            padding-right: max(1rem, env(safe-area-inset-right));
          }
          
          .pwa-standalone {
            padding-top: max(1rem, env(safe-area-inset-top));
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }
        }
        
        /* Pixel 8 Pro specific optimizations */
        @media screen and (max-width: 428px) and (max-height: 926px) {
          .pwa-standalone {
            height: 100vh !important;
            height: calc(var(--vh, 1vh) * 100) !important;
            min-height: 100vh !important;
            min-height: calc(var(--vh, 1vh) * 100) !important;
            max-height: 100vh !important;
            max-height: calc(var(--vh, 1vh) * 100) !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Cleanup on unmount
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []); // Empty dependency array since this only needs to run once

  return (
    <div className={shellClasses} style={shellStyles}>
      {children}
    </div>
  );
};

export default MobileShell;