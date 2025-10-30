import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import '../../styles/components/Layout.css';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
      
      <div className="layout-main">
        <Header onMenuClick={toggleSidebar} />
        <main className="layout-content scrollbar-hide">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;