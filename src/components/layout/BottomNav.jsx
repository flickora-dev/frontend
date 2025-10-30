import { Link, useLocation } from 'react-router-dom';
import { Home, Film, MessageCircle, Heart, User } from 'lucide-react';
import '../../styles/components/BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/movies', icon: Film, label: 'Movies' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/favorites', icon: Heart, label: 'Favorites' },
    { path: '/settings', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;