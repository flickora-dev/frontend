import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Loader2, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
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
      setLocalError("All fields are required.");
      const card = document.getElementById('register-card');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
      }
      return;
    }

    // Validate passwords match before submitting
    if (formData.password !== formData.password2) {
      setLocalError("Passwords don't match.");
      const card = document.getElementById('register-card');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
      }
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
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
      console.error('Registration submission error:', err);
      setLocalError('An unexpected error occurred. Please try again.');
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
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription>
              Join the AI-powered movie discovery platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {localError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-start gap-2 animate-in fade-in-50 slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Registration Failed</p>
                    <p className="text-xs mt-1">{localError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 8 characters)"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password2">Confirm Password</Label>
                <Input
                  id="password2"
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="Confirm your password"
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;