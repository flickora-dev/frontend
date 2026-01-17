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

  // Detect user's platform
  const getPlatform = () => {
    const userAgent = navigator.userAgent || window.opera;

    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'ios';
    }

    // Android detection
    if (/android/i.test(userAgent)) {
      return 'android';
    }

    // Desktop detection
    return 'desktop';
  };

  const platform = getPlatform();

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
            className="bg-slate-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Jak zainstalować?</h3>
            </div>

            {/* iOS Instructions */}
            {platform === 'ios' && (
              <div className="space-y-3">
                <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg p-3">
                  <p className="text-sm text-amber-300 font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    <span>WAŻNE: Musisz używać Safari!</span>
                  </p>
                  <p className="text-xs text-amber-200 mt-1">
                    Chrome i Firefox na iOS nie mogą instalować PWA
                  </p>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span>📱</span>
                    <span>Instrukcja dla iPhone/iPad:</span>
                  </p>
                  <ol className="space-y-2 text-sm text-slate-300">
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Otwórz w <strong className="text-white">Safari</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Kliknij <strong className="text-white">Udostępnij</strong> (kwadrat ze strzałką w górę na dolnym pasku)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Przewiń i wybierz <strong className="text-white">"Dodaj do ekranu początkowego"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span>Kliknij <strong className="text-white">"Dodaj"</strong></span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {platform === 'android' && (
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🤖</span>
                  <span>Instrukcja dla Android:</span>
                </p>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Kliknij menu <strong className="text-white">⋮</strong> (trzy kropki)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Wybierz <strong className="text-white">"Dodaj do ekranu głównego"</strong> lub <strong className="text-white">"Zainstaluj"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Potwierdź klikając <strong className="text-white">"Dodaj"</strong></span>
                  </li>
                </ol>
              </div>
            )}

            {/* Desktop Instructions */}
            {platform === 'desktop' && (
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>💻</span>
                  <span>Instrukcja dla komputera:</span>
                </p>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Szukaj ikony <strong className="text-white">⊕</strong> lub <strong className="text-white">↓</strong> w pasku adresu</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Kliknij i wybierz <strong className="text-white">"Zainstaluj Flickora"</strong></span>
                  </li>
                </ol>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Lub:</strong> Menu przeglądarki → "Zainstaluj Flickora"
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-4"
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
