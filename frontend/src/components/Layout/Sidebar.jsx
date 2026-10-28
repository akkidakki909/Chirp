import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FiHome, FiSearch, FiBell, FiMail, FiBookmark,
  FiUser, FiFeather, FiSun, FiMoon, FiMoreHorizontal, FiLogOut
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: FiHome, label: 'Home' },
  { path: '/explore', icon: FiSearch, label: 'Explore' },
  { path: '/notifications', icon: FiBell, label: 'Notifications' },
  { path: '/messages', icon: FiMail, label: 'Messages' },
  { path: '/bookmarks', icon: FiBookmark, label: 'Bookmarks' },
  { path: '/profile', icon: FiUser, label: 'Profile' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });
  useEffect(() => { let live = true; const load = async () => { try { const [n,m] = await Promise.all([apiClient.get('/notifications/unread-count'), apiClient.get('/messages/unread-count')]); if(live) setCounts({notifications:n.data.count||0,messages:m.data.count||0}); } catch (e) { console.warn('Could not refresh sidebar counts', e.message); } }; load(); const timer=setInterval(load,15000); window.addEventListener('focus',load); return()=>{live=false;clearInterval(timer);window.removeEventListener('focus',load);}; }, []);

  return (
    <aside className="sidebar" id="main-sidebar">
      <div className="sidebar-inner">
        {/* Logo */}
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🐦</span>
          <span className="logo-text font-heading">Chirp</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase()}`}
            >
              <span className="nav-icon-wrapper">
                <item.icon className="nav-icon" />
                {((item.label === 'Notifications' && counts.notifications) || (item.label === 'Messages' && counts.messages)) > 0 && <span className="nav-badge">{item.label === 'Notifications' ? counts.notifications : counts.messages}</span>}
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}

          {/* Theme toggle */}
          <button className="nav-item theme-toggle" onClick={toggleTheme} id="theme-toggle">
            <span className="nav-icon-wrapper">
              {theme === 'light' ? <FiMoon className="nav-icon" /> : <FiSun className="nav-icon" />}
            </span>
            <span className="nav-label">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </nav>

        {/* Post Button */}
        <button className="compose-btn btn btn-primary btn-lg btn-full" onClick={() => navigate('/')} id="compose-btn">
          <FiFeather className="compose-icon-mobile" />
          <span className="compose-text">Post</span>
        </button>

        {/* User Card */}
        <div className="sidebar-user" onClick={() => setShowUserMenu(!showUserMenu)} id="sidebar-user">
          <img src={user?.avatar} alt={user?.displayName} className="avatar avatar-md" />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name font-semibold truncate">{user?.displayName}</span>
            <span className="sidebar-user-handle text-secondary truncate">{user?.handle}</span>
          </div>
          <FiMoreHorizontal className="sidebar-user-more" />

          {showUserMenu && (
            <div className="user-menu animate-slide-up" id="user-menu">
              <button className="user-menu-item" onClick={() => navigate('/profile')}>
                <FiUser /> View Profile
              </button>
              <button className="user-menu-item text-danger" onClick={() => { setShowUserMenu(false); navigate('/'); window.location.reload(); }}>
                <FiLogOut /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
