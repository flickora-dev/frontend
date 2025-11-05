import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from '../api/axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/login/', {
            username,
            password,
          });

          const { user, tokens } = response.data;

          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Register
      register: async (username, email, password, password2) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/register/', {
            username,
            email,
            password,
            password2,
          });

          const { user, tokens } = response.data;

          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          // Extract error message from response
          const errorData = error.response?.data;
          let errorMessage = 'Registration failed';
          
          if (errorData) {
            // Check for field-specific errors
            if (errorData.username && Array.isArray(errorData.username)) {
              errorMessage = errorData.username[0];
            } else if (errorData.email && Array.isArray(errorData.email)) {
              errorMessage = errorData.email[0];
            } else if (errorData.password && Array.isArray(errorData.password)) {
              errorMessage = errorData.password[0];
            } else if (errorData.password2 && Array.isArray(errorData.password2)) {
              errorMessage = errorData.password2[0];
            } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
              errorMessage = errorData.non_field_errors[0];
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            }
          }
          
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Logout
      logout: async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            await axios.post('/auth/logout/', {
              refresh_token: refreshToken,
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      // Get profile
      getProfile: async () => {
        try {
          const response = await axios.get('/auth/profile/');
          set({ user: response.data });
        } catch (error) {
          console.error('Get profile error:', error);
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;