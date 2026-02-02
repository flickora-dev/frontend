import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [localError, setLocalError] = useState('');

  // Sync error from store to local state
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  // Clear errors when user starts typing
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) {
      setLocalError('');
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalError(''); // Clear any previous errors

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate('/');
      } else {
        // Error is already set in the store and will sync via useEffect
        // Shake the card to draw attention to the error
        const card = document.getElementById('login-card');
        if (card) {
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 500);
        }
      }
    } catch (err) {
      console.error('Login submission error:', err);
      setLocalError(t('auth.unexpectedError'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Film className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">flickora</h1>
        </div>

        {/* Login Card */}
        <Card id="login-card" className="border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription>
              {t('auth.signInToContinue')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {localError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-start gap-2 animate-in fade-in-50 slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{t('auth.loginFailed')}</p>
                    <p className="text-xs mt-1">{localError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">{t('auth.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={t('auth.enterYourUsername')}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.enterYourPassword')}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t('auth.signUp')}
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            ← {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;