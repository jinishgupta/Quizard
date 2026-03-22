import React from 'react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import DailyChallengHero from '../components/home-dashboard/DailyChallengHero';
import StreakBanner from '../components/home-dashboard/StreakBanner';
import CategoryGrid from '../components/home-dashboard/CategoryGrid';
import LeagueSidebar from '../components/home-dashboard/LeagueSidebar';

export default function HomeDashboard() {
  return (
    <div className="min-h-screen bg-brand-bg grid-pattern">
      <Navbar credits={247} notificationCount={3} />

      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 pb-24 md:pb-8">
        <div className="flex gap-6 xl:gap-8 mt-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            <DailyChallengHero />
            <StreakBanner />
            <CategoryGrid />
          </div>

          {/* Desktop right sidebar */}
          <aside className="hidden lg:block w-80 xl:w-88 shrink-0">
            <LeagueSidebar />
          </aside>
        </div>
      </main>

      <MobileBottomNav active="home" />
    </div>
  );
}
