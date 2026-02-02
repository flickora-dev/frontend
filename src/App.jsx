import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import InstallPWA from './components/pwa/InstallPWA';

// Pages (będziemy tworzyć w następnym kroku)
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import RecentChats from './pages/RecentChats';
import Favorites from './pages/Favorites';
import Trending from './pages/Trending';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './App.css';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <InstallPWA />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="movies" element={<Movies />} />
          <Route path="movies/:id" element={<MovieDetail />} />
          <Route path="trending" element={<Trending />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="recent" element={<RecentChats />} />
          <Route path="recent/:conversationId" element={<RecentChats />} />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;