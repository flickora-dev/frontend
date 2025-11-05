// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/common/loadingSpinner';
import '../styles/pages/Login.css';

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearError();
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    
    // Validate required fields
    if (!formData.username || !formData.email || !formData.password || !formData.password2) {
      setLocalError("All fields are required.");
      return;
    }

    // Validate passwords match before submitting
    if (formData.password !== formData.password2) {
      setLocalError("Passwords don't match.");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.password2
    );
    
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Film size={32} />
            </div>
            <h1 className="login-logo-text">flickora</h1>
          </div>
          <h2 className="login-title">Create your account</h2>
          <p className="login-subtitle">Join the AI-powered movie discovery platform</p>
        </div>

        <div className="login-form-wrapper">
          <form onSubmit={handleSubmit} className="login-form">
            {(error || localError) && (
              <div className="error-message">
                {error || localError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="form-submit"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="login-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Register;