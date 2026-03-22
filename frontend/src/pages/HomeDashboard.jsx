import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import DailyChallengHero from '../components/home-dashboard/DailyChallengHero';
import StreakBanner from '../components/home-dashboard/StreakBanner';
import CategoryGrid from '../components/home-dashboard/CategoryGrid';
import LeagueSidebar from '../components/home-dashboard/LeagueSidebar';
import { useUserProfile, useCreditBalance } from '../hooks/useApi';

export default function HomeDashboard() {
  const { data: profile } = useUserProfile();
  const { data: creditData } = useCreditBalance();

  const credits = creditData?.balance || 0;
  const notificationCount = 3; // TODO: Implement notifications

  return (
    <div className="min-h-screen bg-[#0A0F1A] dot-pattern">
      <Navbar credits={credits} notificationCount={notificationCount} />

      <main className="max-w-7xl mx-auto px-4 lg:px-6 pb-24 md:pb-8 pt-6">
        <div className="flex gap-6 lg:gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">
            <DailyChallengHero />
            <StreakBanner profile={profile} />
            <CategoryGrid />
          </div>

          {/* Desktop right sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <LeagueSidebar />
          </aside>
        </div>
      </main>

      <MobileBottomNav active="home" />
    </div>
  );
}
