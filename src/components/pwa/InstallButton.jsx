import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * Simple install button that works everywhere
 * Shows installation instructions for iOS Safari and other browsers
 */
const InstallButton = ({ variant = 'default', size = 'default', className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://');

    setIsStandalone(standalone);

    // Listen for install prompt (Chrome/Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // If we have the deferred prompt (Chrome/Edge Android)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA installed via prompt');
      }
      setDeferredPrompt(null);
    } else {
      // Show instructions for iOS or when prompt not available
      setShowInstructions(true);
    }
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant={variant}
        size={size}
        className={className}
      >
        <Download className="w-4 h-4 mr-2" />
        Zainstaluj App
      </Button>

      {/* Instructions Modal/Dialog */}
      {showInstructions && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="bg-slate-900 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Jak zainstalować?</h3>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-white mb-2">📱 iPhone/iPad (Safari):</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Kliknij przycisk <strong>Udostępnij</strong> (kwadrat ze strzałką w górę)</li>
                  <li>Przewiń w dół i wybierz <strong>"Dodaj do ekranu początkowego"</strong></li>
                  <li>Kliknij <strong>"Dodaj"</strong></li>
                </ol>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">🤖 Android (Chrome):</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Kliknij menu <strong>⋮</strong> (trzy kropki w prawym górnym rogu)</li>
                  <li>Wybierz <strong>"Dodaj do ekranu głównego"</strong> lub <strong>"Zainstaluj aplikację"</strong></li>
                  <li>Kliknij <strong>"Dodaj"</strong> lub <strong>"Zainstaluj"</strong></li>
                </ol>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">💻 Desktop (Chrome/Edge):</p>
                <p>Szukaj ikony instalacji w pasku adresu lub w menu przeglądarki</p>
              </div>
            </div>

            <Button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6"
            >
              Rozumiem
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallButton;
