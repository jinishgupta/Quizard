import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AppLogo from './ui/AppLogo';
import CreditBadge from './ui/CreditBadge';

const NAV_LINKS = [
  { label: 'Home', href: '/home-dashboard' },
  { label: 'Play', href: '/play-screen' },
  { label: 'Categories', href: '/categories' },
  { label: 'Leagues', href: '/leagues' },
  { label: 'Profile', href: '/profile' },
];

export default function Navbar({ credits, notificationCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { logout, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0F1A] border-b-2 border-[#1F2937]">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/home-dashboard')}
        >
          <AppLogo size={32} />
          <span className="font-sans font-extrabold text-white text-lg hidden sm:block tracking-tight">
            Quizard
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={`navbar-${item.label.toLowerCase()}`}
                onClick={() => navigate(item.href)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1D4ED8] text-white'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <CreditBadge amount={credits} animated />
          <button className="relative p-2 rounded-lg hover:bg-[#1F2937] transition-colors duration-150">
            <Bell size={18} className="text-[#9CA3AF]" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#1D4ED8] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
          <button className="p-2 rounded-lg hover:bg-[#1F2937] transition-colors duration-150">
            <Settings size={18} className="text-[#9CA3AF]" />
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#1F2937] transition-colors duration-150"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                {user?.displayName?.[0] || user?.username?.[0] || 'U'}
              </div>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1f2e] border border-gray-800 rounded-lg shadow-xl py-2">
                <div className="px-4 py-2 border-b border-gray-800">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.displayName || user?.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#1F2937] transition-colors duration-150 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}