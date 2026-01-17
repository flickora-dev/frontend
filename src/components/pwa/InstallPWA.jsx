import { useState, useEffect } from 'react';
import { Download, X, Settings } from 'lucide-react';
import { Button } from '../ui/button';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (PWA installed and launched)
    const checkIfRunningAsStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');

      // Only return true if ACTUALLY running as standalone
      return isStandaloneMode || isIOSStandalone || isAndroidApp;
    };

    if (checkIfRunningAsStandalone()) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the banner recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = new Date().getTime();
      const daysSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60 * 24);

      if (daysSinceDismissed < 7) {
        // User dismissed recently, don't show banner
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e);
      // Show the install banner only if not dismissed recently
      setShowInstallBanner(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      // Clear dismissed flag
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallBanner(false);
    } else {
      console.log('User dismissed the install prompt');
      handleDismiss();
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Store in localStorage to not show again for 7 days
    localStorage.setItem('pwa-install-dismissed', new Date().getTime().toString());
  };

  // Don't show anything if app is already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if no prompt is available or user dismissed it
  if (!showInstallBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 max-w-md mx-auto md:mx-0">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-base mb-1">
              Zainstaluj aplikację
            </h3>
            <p className="text-slate-300 text-sm mb-2">
              Dodaj Flickora do ekranu głównego i korzystaj offline
            </p>
            <p className="text-slate-400 text-xs mb-3 flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Możesz to zrobić później w Ustawieniach
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Zainstaluj
              </Button>

              <Button
                onClick={handleDismiss}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                size="sm"
              >
                Później
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
