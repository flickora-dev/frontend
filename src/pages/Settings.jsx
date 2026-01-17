import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Moon, Sun, Bell, Globe, Volume2, Eye, Download, Smartphone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';
import useAuthStore from '../store/authStore';

const Settings = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Settings state (would be stored in localStorage or backend in production)
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [autoplay, setAutoplay] = useState(true);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (PWA installed and launched)
    const checkIfRunningAsStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');

      // Debug logs
      console.log('PWA Check:', {
        standalone: isStandaloneMode,
        iosStandalone: isIOSStandalone,
        referrer: document.referrer,
        displayMode: isStandaloneMode ? 'standalone' : 'browser'
      });

      // Only return true if ACTUALLY running as standalone
      return isStandaloneMode || isIOSStandalone || isAndroidApp;
    };

    if (checkIfRunningAsStandalone()) {
      console.log('PWA: Running in standalone mode');
      setIsInstalled(true);
      return;
    }

    // If not running standalone, the app is opened in browser
    console.log('PWA: Running in browser mode');

    // Check localStorage for previous installation
    const wasInstalled = localStorage.getItem('pwa-installed') === 'true';
    if (wasInstalled) {
      console.log('PWA: Previously installed (from localStorage)');
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('appinstalled event fired');
      setIsInstalled(true);
      setDeferredPrompt(null);
      // Store installation state
      localStorage.setItem('pwa-installed', 'true');
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
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: SettingsIcon },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'pl', label: 'Polski' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
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
            <h1 className="text-4xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">Customize your experience</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the app looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Theme</label>
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
              <p className="text-xs text-muted-foreground">
                Theme changes will be applied in a future update
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about new movies and updates
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  notifications ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    notifications ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Notification settings will be functional in a future update
            </p>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language & Region
            </CardTitle>
            <CardDescription>
              Set your preferred language and regional settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Language support will be added in a future update
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Playback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Playback
            </CardTitle>
            <CardDescription>
              Control video and media playback settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autoplay Videos</p>
                <p className="text-sm text-muted-foreground">
                  Automatically play video trailers when available
                </p>
              </div>
              <button
                onClick={() => setAutoplay(!autoplay)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  autoplay ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    autoplay ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Playback settings will be functional when video support is added
            </p>
          </CardContent>
        </Card>

        {/* PWA Install */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Instaluj Aplikację
            </CardTitle>
            <CardDescription>
              Zainstaluj Flickora jako aplikację na swoim urządzeniu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-3">
                  <Download className="w-8 h-8 text-green-500" />
                </div>
                <p className="font-medium text-green-500 mb-1">Aplikacja zainstalowana!</p>
                <p className="text-sm text-muted-foreground">
                  Flickora jest już zainstalowana na Twoim urządzeniu
                </p>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Download className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">Zainstaluj jako aplikację</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Dodaj Flickora do ekranu głównego i korzystaj jak z natywnej aplikacji.
                        Działa offline, szybciej się ładuje i wygląda lepiej!
                      </p>
                      <Button
                        onClick={handleInstallClick}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Zainstaluj teraz
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Korzyści:</p>
                  <ul className="space-y-1 ml-4">
                    <li>✓ Szybszy dostęp z ekranu głównego</li>
                    <li>✓ Działa offline z cache</li>
                    <li>✓ Wygląd i działanie jak natywna aplikacja</li>
                    <li>✓ Brak paska adresu przeglądarki</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-3">
                  <Download className="w-8 h-8 text-blue-500" />
                </div>
                <p className="font-medium mb-1">Instalacja dostępna przez przeglądarkę</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Użyj wbudowanej funkcji przeglądarki aby zainstalować aplikację
                </p>
                <div className="space-y-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
                  <p className="font-medium text-foreground mb-2">Instrukcje instalacji:</p>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-foreground">Chrome/Edge (Desktop):</p>
                      <p className="text-xs">Kliknij ikonę instalacji w pasku adresu lub Menu (⋮) → "Zainstaluj Flickora"</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Safari (iOS):</p>
                      <p className="text-xs">Przycisk Udostępnij → "Dodaj do ekranu początkowego"</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Chrome (Android):</p>
                      <p className="text-xs">Menu (⋮) → "Dodaj do ekranu głównego" lub "Zainstaluj aplikację"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About Flickora</CardTitle>
            <CardDescription>
              Information about this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Built with</span>
              <span className="font-medium">React + Django</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PWA Enabled</span>
              <span className="font-medium text-green-500">Yes</span>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              AI-Powered Movie Discovery Platform
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
