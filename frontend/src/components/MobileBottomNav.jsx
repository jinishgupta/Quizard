import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, Trophy, User, Grid } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'nav-home', label: 'Home', icon: Home, href: '/home-dashboard' },
  { key: 'nav-play', label: 'Play', icon: Zap, href: '/play-screen' },
  { key: 'nav-cats', label: 'Topics', icon: Grid, href: '/categories' },
  { key: 'nav-leagues', label: 'Leagues', icon: Trophy, href: '/leagues' },
  { key: 'nav-profile', label: 'Profile', icon: User, href: '/profile' },
];

export default function MobileBottomNav({ active }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-[#0A0F1A] border-t-2 border-[#1F2937] px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || active === item.key;
            const IconComponent = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.href)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                  isActive ? 'text-[#3B82F6]' : 'text-[#6B7280] hover:text-[#9CA3AF]'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all duration-150 ${isActive ? 'bg-[#1E3A5F]' : ''}`}>
                  <IconComponent size={20} />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}