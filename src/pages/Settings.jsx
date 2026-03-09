import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Moon, Sun, Eye, Download, Smartphone, Monitor } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

const Settings = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canShowPrompt, setCanShowPrompt] = useState(false);

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
      // Mark as installed in localStorage when running in standalone
      localStorage.setItem('pwa-was-installed', 'true');
      return;
    }

    // Listen for the beforeinstallprompt event (Chrome/Edge on Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanShowPrompt(true);

      // If we're getting install prompt, app is NOT installed yet
      // Clear the localStorage flag if it exists
      localStorage.removeItem('pwa-was-installed');
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-was-installed', 'true');
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

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const themeOptions = [
    { value: 'light', label: t('settings.light'), icon: Sun },
    { value: 'dark', label: t('settings.dark'), icon: Moon },
    { value: 'system', label: t('settings.system'), icon: Monitor },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <SettingsIcon className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Login Required</h2>
          <p className="text-muted-foreground">Please log in to access settings</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">{t('settings.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('settings.customizeExperience')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>
              {t('settings.appearanceDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('settings.theme')}</label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        theme === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PWA Install */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              {t('settings.installApp')}
            </CardTitle>
            <CardDescription>
              {t('settings.installAppDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-3">
                  <Download className="w-8 h-8 text-green-500" />
                </div>
                <p className="font-medium text-green-500 mb-1">{t('settings.appInstalled')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.appInstalledDesc')}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  {t('settings.launchFromHome')}
                </p>
              </div>
            ) : canShowPrompt && deferredPrompt ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Download className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">{t('settings.installAsApp')}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('settings.installAsAppDesc')}
                      </p>
                      <Button
                        onClick={handleInstallClick}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t('settings.installNow')}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('settings.benefits')}</p>
                  <ul className="space-y-1 ml-4">
                    <li>✓ {t('settings.benefit1')}</li>
                    <li>✓ {t('settings.benefit2')}</li>
                    <li>✓ {t('settings.benefit3')}</li>
                    <li>✓ {t('settings.benefit4')}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {/* If no install prompt available and iOS, show instructions */}
                {platform === 'ios' ? (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-3 mx-auto">
                      <Download className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="font-medium mb-1 text-center">{t('settings.howToInstall')}</p>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      {t('settings.followInstructions')}
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-3">
                      <Download className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="font-medium mb-2 text-green-500">{t('settings.probablyInstalled')}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('settings.checkInstructions')}
                    </p>
                  </div>
                )}

                {/* iOS - Safari ONLY */}
                {platform === 'ios' && (
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📱</span>
                      <h3 className="font-semibold text-blue-400 text-lg">iPhone / iPad</h3>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                      <p className="text-sm text-amber-400 font-medium flex items-center gap-2">
                        <span>⚠️</span>
                        <span>WAŻNE: Musisz używać przeglądarki Safari!</span>
                      </p>
                      <p className="text-xs text-amber-300 mt-2">
                        Chrome, Firefox i inne przeglądarki na iOS NIE MOGĄ instalować aplikacji PWA ze względu na ograniczenia Apple.
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-3 text-sm">Instrukcja krok po kroku:</p>
                      <ol className="space-y-3 text-sm ml-1">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <span>Otwórz tę stronę w przeglądarce <strong>Safari</strong> (jeśli jesteś w Chrome/Firefox - skopiuj adres URL i wklej w Safari)</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <span>Kliknij przycisk <strong>"Udostępnij"</strong> (kwadrat ze strzałką w górę) na dolnym pasku</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          <span>Przewiń w dół i wybierz <strong>"Dodaj do ekranu początkowego"</strong></span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                          <span>Kliknij <strong>"Dodaj"</strong> w prawym górnym rogu</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                          <span className="font-medium text-green-500">Gotowe! Aplikacja pojawi się na ekranie głównym 🎉</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* Android */}
                {platform === 'android' && (
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🤖</span>
                      <h3 className="font-semibold text-green-400 text-lg">Android</h3>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-3 text-sm">Instrukcja krok po kroku:</p>
                      <ol className="space-y-3 text-sm ml-1">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <span>Kliknij menu <strong>⋮</strong> (trzy kropki) w prawym górnym rogu przeglądarki</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <span>Wybierz <strong>"Dodaj do ekranu głównego"</strong> lub <strong>"Zainstaluj aplikację"</strong></span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          <span>Kliknij <strong>"Dodaj"</strong> lub <strong>"Zainstaluj"</strong> w oknie potwierdzenia</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                          <span className="font-medium text-green-500">Gotowe! Aplikacja pojawi się na ekranie głównym 🎉</span>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
                      <p className="text-xs text-blue-300">
                        <strong>Wskazówka:</strong> Jeśli nie widzisz opcji instalacji, odśwież stronę i spróbuj ponownie.
                      </p>
                    </div>
                  </div>
                )}

                {/* Desktop */}
                {platform === 'desktop' && (
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">💻</span>
                      <h3 className="font-semibold text-purple-400 text-lg">Komputer</h3>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-3 text-sm">Instrukcja krok po kroku:</p>
                      <ol className="space-y-3 text-sm ml-1">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <span>Szukaj ikony instalacji <strong>⊕</strong> lub <strong>↓</strong> w pasku adresu (po prawej stronie)</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <span>Kliknij ikonę i wybierz <strong>"Zainstaluj"</strong> lub <strong>"Zainstaluj Flickora"</strong></span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                          <span className="font-medium text-purple-400">Gotowe! Aplikacja zostanie zainstalowana 🎉</span>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
                      <p className="text-xs text-blue-300 mb-2">
                        <strong>Alternatywnie:</strong>
                      </p>
                      <ul className="text-xs text-blue-200 space-y-1 ml-4">
                        <li>• <strong>Chrome:</strong> Menu (⋮) → "Zainstaluj Flickora"</li>
                        <li>• <strong>Edge:</strong> Menu (⋯) → "Aplikacje" → "Zainstaluj tę witrynę jako aplikację"</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.aboutFlickora')}</CardTitle>
            <CardDescription>
              {t('settings.aboutDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('settings.version')}</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('settings.builtWith')}</span>
              <span className="font-medium">React + Django</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('settings.pwaEnabled')}</span>
              <span className="font-medium text-green-500">{t('settings.yes')}</span>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              {t('settings.aiPowered')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
