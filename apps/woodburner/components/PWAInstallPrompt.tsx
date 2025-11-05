import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay (don't be too pushy)
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000); // 10 seconds delay
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleIOSInstallClick = () => {
    setShowInstallPrompt(false);
    // Show iOS-specific instructions
    alert('To install GetTheWashingOut on iOS:\n\n1. Tap the Share button in Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right corner');
  };

  // Don't show if already installed or dismissed in this session
  if (isInstalled || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  // Don't show until we have something to show
  if (!showInstallPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center p-4">
        {/* Install Prompt Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-sky-200 animate-slide-up">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Dismiss install prompt"
          >
            ✕
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4 text-5xl">
            ☀️
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Install GetTheWashingOut!
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Get weather recommendations faster with our app! Install it on your home screen for quick access.
            </p>

            {/* Benefits */}
            <div className="bg-sky-50 rounded-2xl p-3 mb-4 text-left">
              <ul className="text-xs text-slate-700 space-y-1">
                <li>✅ Works offline with cached weather</li>
                <li>⚡ Faster loading times</li>
                <li>📱 Native app experience</li>
                <li>🔔 Weather change notifications (coming soon!)</li>
              </ul>
            </div>

            {/* Install Buttons */}
            <div className="space-y-2">
              {isIOS ? (
                <button
                  onClick={handleIOSInstallClick}
                  className="w-full bg-sky-500 text-white font-medium py-3 px-4 rounded-2xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  Install on iOS
                </button>
              ) : (
                <button
                  onClick={handleInstallClick}
                  disabled={!deferredPrompt}
                  className="w-full bg-sky-500 text-white font-medium py-3 px-4 rounded-2xl hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <span>⬇️</span>
                  Install App
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="w-full text-slate-500 font-medium py-2 px-4 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default PWAInstallPrompt;