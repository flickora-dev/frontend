import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
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

    // Validate required fields
    if (!formData.username || !formData.email || !formData.password || !formData.password2) {
      setLocalError(t('auth.allFieldsRequired'));
      const card = document.getElementById('register-card');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
      }
      return;
    }

    // Validate passwords match before submitting
    if (formData.password !== formData.password2) {
      setLocalError(t('auth.passwordsDontMatch'));
      const card = document.getElementById('register-card');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
      }
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setLocalError(t('auth.passwordMinLength'));
      const card = document.getElementById('register-card');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
      }
      return;
    }

    try {
      const result = await register(
        formData.username,
        formData.email,
        formData.password,
        formData.password2
      );

      if (result.success) {
        navigate('/');
      } else {
        // Error is already set in the store and will sync via useEffect
        // Shake the card to draw attention to the error
        const card = document.getElementById('register-card');
        if (card) {
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 500);
        }
      }
    } catch (err) {
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

        {/* Register Card */}
        <Card id="register-card" className="border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">{t('auth.createYourAccount')}</CardTitle>
            <CardDescription>
              {t('auth.joinPlatform')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {localError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-start gap-2 animate-in fade-in-50 slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{t('auth.registrationFailed')}</p>
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
                  placeholder={t('auth.chooseUsername')}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.enterYourEmail')}
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
                  placeholder={t('auth.createPassword')}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password2">{t('auth.confirmPassword')}</Label>
                <Input
                  id="password2"
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder={t('auth.confirmYourPassword')}
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
                    {t('auth.creatingAccount')}
                  </>
                ) : (
                  t('auth.createAccount')
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('auth.signIn')}
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

export default Register;